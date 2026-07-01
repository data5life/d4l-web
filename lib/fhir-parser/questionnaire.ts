/**
 * FHIR Questionnaire Parser
 * Transforms FHIR questionnaire format to simplified frontend format
 */

import {
  DateOffset,
  DateValidation,
  Operator,
  ParsedQuestionnaire,
  Question,
  SliderRange,
  TextValidation,
} from '@/lib/questionnaireTypes';

import {
  validate,
  exists,
  validateString,
  validateObject,
  validateArray,
  validateNumber,
} from './helper';
import { QuestionInputType } from '@d4l/collect-lib';
import { Record } from '@prisma/client/runtime/client';

interface FHIRQuestionnaireRaw {
  name: string;
  title: string;
  url: string;
  version: string;
  contained?: unknown;
  item: unknown[];
}

interface CodeableConcept {
  coding?: Array<{ code?: string; system?: string }>;
}

interface FHIRExtension {
  url: string;
  valueDecimal?: number;
  valueInteger?: number;
  valueString?: string;
  valueBoolean?: boolean;
  valueDate?: string;
  valueCodeableConcept?: CodeableConcept;
}

function validateCodeableConcept(cc: unknown, path: string): asserts cc is CodeableConcept {
  validateObject(cc, path);
  if (cc.coding !== undefined) {
    validateArray(cc.coding, `${path}.coding`);

    validate(
      cc.coding.every((cRaw) => {
        const isObject = typeof cRaw === 'object' && cRaw !== null;
        if (!isObject) return false;

        const c = cRaw as Record<string, unknown>;

        const isCodeValid = c.code === undefined || typeof c.code === 'string';
        const isSystemValid = c.system === undefined || typeof c.system === 'string';

        return isCodeValid && isSystemValid;
      }),
      `${path}.coding elements`,
      'Array<{ code?: string, system?: string }>',
      cc.coding,
    );
  }
}

function getAnswer(obj: Record<string, unknown>, path: string, type: Question['type']) {
  if (type === 'decimal' || type === 'scale-numeric') {
    validate(exists(obj.answerDecimal), path, `field answerDecimal due to type ${type}`, obj);
    validateNumber(obj.answerDecimal, `${path}.answerDecimal`);

    return { value: obj.answerDecimal.toString() };
  } else if (type === 'date' || type === 'year') {
    validate(exists(obj.answerDate), path, `field answerDate due to type ${type}`, obj);
    validateString(obj.answerDate, `${path}.answerDate`);

    return { value: obj.answerDate };
  } else if (type === 'scale-ordinal') {
    validate(exists(obj.answerInteger), path, `field answerInteger due to type ${type}`, obj);
    validateNumber(obj.answerInteger, `${path}.answerInteger`);

    return { value: obj.answerInteger.toString() };
  } else if (type === 'single-select' || type === 'multi-select') {
    validate(exists(obj.answerCoding), path, `field answerCoding due to type ${type}`, obj);
    validateObject(obj.answerCoding, path);

    validateString(obj.answerCoding.code, `${path}.answerCoding.code`);
    return {
      value: obj.answerCoding.code,
    };
  } else {
    validate(exists(obj.answerString), path, `field answerString due to type ${type}`, obj);
    validateString(obj.answerString, `${path}.answerString`);

    return { value: obj.answerString };
  }
}

const SUPPORTED_EXTENSIONS = {
  minValue: {
    url: 'http://hl7.org/fhir/StructureDefinition/minValue',
    type: 'polymorph',
  },
  maxValue: {
    url: 'http://hl7.org/fhir/StructureDefinition/maxValue',
    type: 'polymorph',
  },
  sliderStepSize: {
    url: 'http://fhir.data4life.care/StructureDefinition/slider-step-size',
    type: 'number',
  },
  itemControl: {
    url: 'http://hl7.org/fhir/StructureDefinition/questionnaire-itemControl',
    type: 'codeableConcept',
  },
  sliderLabelMin: {
    url: 'http://fhir.data4life.care/StructureDefinition/slider-label-min',
    type: 'string',
  },
  sliderLabelMax: {
    url: 'http://fhir.data4life.care/StructureDefinition/slider-label-max',
    type: 'string',
  },
  minLength: {
    url: 'http://hl7.org/fhir/StructureDefinition/minLength',
    type: 'number',
  },
  relativeMin: {
    url: 'http://fhir.data4life.care/StructureDefinition/relative-min-value',
    type: 'string',
  },
  relativeMax: {
    url: 'http://fhir.data4life.care/StructureDefinition/relative-max-value',
    type: 'string',
  },
} as const;

type ExtensionKey = keyof typeof SUPPORTED_EXTENSIONS;

// ============================================================================
// HELPER: Get extension value by URL suffix
// ============================================================================
function getExtension(
  extensions: FHIRExtension[] | undefined,
  extPath: string,
  key: Extract<ExtensionKey, 'sliderStepSize' | 'minLength'>,
): number | null;
function getExtension(
  extensions: FHIRExtension[] | undefined,
  extPath: string,
  key: Extract<ExtensionKey, 'minValue' | 'maxValue'>,
  valueType: 'number',
): number | null;
function getExtension(
  extensions: FHIRExtension[] | undefined,
  extPath: string,
  key: Extract<ExtensionKey, 'minValue' | 'maxValue'>,
  valueType: 'date',
): string | null;
function getExtension(
  extensions: FHIRExtension[] | undefined,
  extPath: string,
  key: Extract<ExtensionKey, 'sliderLabelMin' | 'sliderLabelMax' | 'relativeMin' | 'relativeMax'>,
): string | null;
function getExtension(
  extensions: FHIRExtension[] | undefined,
  extPath: string,
  key: Extract<ExtensionKey, 'itemControl'>,
): CodeableConcept | null;
function getExtension(
  extensions: FHIRExtension[] | undefined,
  extPath: string,
  key: ExtensionKey,
  valueType?: 'date' | 'number',
): number | string | CodeableConcept | null {
  if (!extensions) return null;
  const config = SUPPORTED_EXTENSIONS[key];

  const match = extensions.find((ext) => ext.url === config.url);
  if (!match) return null;

  const path = `${extPath}[${config.url}]`;
  const type = config.type === 'polymorph' ? valueType! : config.type;
  switch (type) {
    case 'number': {
      const numericRaw = match.valueDecimal ?? match.valueInteger;
      validateNumber(numericRaw, path);
      validate(!isNaN(numericRaw), path, 'number', numericRaw);

      return numericRaw;
    }

    case 'string': {
      const raw = match.valueString;
      validateString(raw, path);

      return raw;
    }

    case 'date': {
      const raw = match.valueDate;
      validateString(raw, path);

      return raw;
    }

    case 'codeableConcept': {
      const cc = match.valueCodeableConcept;

      if (!exists(cc)) return null;

      validateCodeableConcept(cc, path);
      return cc;
    }

    default:
      const _exhaustiveCheck: never = type;
      throw new Error(`Unknown questionInputType: ${JSON.stringify(_exhaustiveCheck)}`);
  }
}

// ============================================================================
// HELPER: Get custom question class from extensions
// ============================================================================
function getCustomQuestionClass(
  extensions: FHIRExtension[] | undefined,
  extPath: string,
): string | null {
  const cc = getExtension(extensions, extPath, 'itemControl');

  const TARGET_SYSTEM = 'http://fhir.data4life.care/r5/CodeSystem/custom-question-class';

  const match = cc?.coding?.find((c) => c.system === TARGET_SYSTEM);
  if (!match) return null;

  validate(
    exists(match.code),
    `${extPath}.itemControl.coding[system=${TARGET_SYSTEM}]`,
    'object with field code',
    match,
  );
  return match.code;
}

// ============================================================================
// HELPER: Parse ISO 8601 duration string (e.g., "P2Y", "P-3M", "-P1W")
// ============================================================================
function parseDuration(duration: string): DateOffset | null {
  if (typeof duration !== 'string') return null;

  // Handle negative prefix: "-P2Y" → negative value
  const isNegative = duration.startsWith('-');
  const normalized = isNegative ? duration.slice(1) : duration;

  // Match pattern: P followed by optional negative, then number, then unit letter
  const match = normalized.match(/^P(-?\d+)([DWMY])$/i);
  if (!match) return null;

  let value = parseInt(match[1], 10);
  if (isNegative) value = -value;

  const unitMap = {
    D: 'days',
    W: 'weeks',
    M: 'months',
    Y: 'years',
  } as const;

  const rawKey = match[2].toUpperCase();
  if (rawKey in unitMap) {
    const unit = unitMap[rawKey as keyof typeof unitMap];
    return { value, unit };
  }
  return null;
}

// ============================================================================
// HELPER: Map FHIR operator to our format
// ============================================================================
function mapOperator(fhirOperator: string, isMultiChoice: boolean): Operator | null {
  switch (fhirOperator) {
    case '=':
      return isMultiChoice ? 'includes' : 'equals';
    case '!=':
      return isMultiChoice ? 'not-includes' : 'not-equals';
    case 'exists':
      return 'exists';
    case '<':
      return 'less-than';
    case '<=':
      return 'less-than-or-equal';
    case '>':
      return 'greater-than';
    case '>=':
      return 'greater-than-or-equal';
    default:
      return null;
  }
}

function parseTextValidation(
  item: Record<string, unknown>,
  itemPath: string,
): TextValidation | undefined {
  // Text validation constraints
  const stringMinLen = getExtension(
    item.extension as FHIRExtension[],
    `${itemPath}.extension`,
    'minLength',
  );
  const stringValidation: TextValidation = {};
  if (stringMinLen) {
    stringValidation.minLength = stringMinLen;
  }
  if (item.maxLength) {
    validateNumber(item.maxLength, `${itemPath}.maxLength`);
    stringValidation.maxLength = item.maxLength;
  }
  return Object.keys(stringValidation).length > 0 ? stringValidation : undefined;
}

function parseDateValidation(item: Record<string, unknown>, extPath: string) {
  const ext = item.extension as FHIRExtension[];
  const validation: { min?: string; max?: string } = {};

  const min = getExtension(ext, extPath, 'minValue', 'date');
  const max = getExtension(ext, extPath, 'maxValue', 'date');

  if (min) {
    validateString(min, `${extPath}.minValue`);
    validation.min = min;
  }
  if (max) {
    validateString(max, `${extPath}.maxValue`);
    validation.max = max;
  }
  return validation;
}

function parseMinMaxValidation(item: Record<string, unknown>, extPath: string) {
  const minMaxValidation: { min?: number; max?: number } = {};
  const ext = item.extension as FHIRExtension[];

  const dateMin = getExtension(ext, extPath, 'minValue', 'number');
  const dateMax = getExtension(ext, extPath, 'maxValue', 'number');
  if (exists(dateMin)) {
    minMaxValidation.min = dateMin;
  }
  if (exists(dateMax)) {
    minMaxValidation.max = dateMax;
  }
  return minMaxValidation;
}

function parseSliderRange(item: Record<string, unknown>, extPath: string): SliderRange {
  const minMax = parseMinMaxValidation(item, extPath);
  validate(exists(minMax.min), `${extPath}.minValue`, 'required', 'missing');
  validate(exists(minMax.max), `${extPath}.maxValue`, 'required', 'missing');
  return minMax as SliderRange;
}

// ============================================================================
// MAIN PARSER
// ============================================================================
export function parseQuestionnaire(input: unknown): ParsedQuestionnaire {
  // Validate root structure
  validateObject(input, 'input');

  const data = input as Record<string, unknown>;

  // Extract questionnaire from wrapper
  validateObject(data.questionnaire, 'input.questionnaire');

  // Validate required questionnaire fields
  validateString(data.questionnaire.name, 'questionnaire.name');
  validateString(data.questionnaire.version, 'questionnaire.version');
  validateString(data.questionnaire.title, 'questionnaire.title');
  validateArray(data.questionnaire.item, 'questionnaire.item');
  validateString(data.questionnaire.url, 'questionnaire.url');

  const q = data.questionnaire as unknown as FHIRQuestionnaireRaw;

  // Step 2: Extract metadata
  const output: ParsedQuestionnaire = {
    name: q.name,
    title: q.title,
    url: q.url,
    version: q.version,
    questions: [],
  };

  // Step 3: Build options lookup map
  const optionsMap = new Map<string, Array<{ value: string; label: string; system: string }>>();

  if (q.contained) {
    validateArray(q.contained, 'questionnaire.contained');

    for (let i = 0; i < q.contained.length; i++) {
      const valueSet = q.contained[i];
      const path = `questionnaire.contained[${i}]`;
      validateObject(valueSet, path);

      validateString(valueSet.id, `${path}.id`);

      const expansion = valueSet.expansion;
      validateObject(expansion, `${path}.expansion`);

      validateArray(expansion.contains, `${path}.expansion.contains`);

      const key = '#' + valueSet.id;
      const options = expansion.contains.map((option: unknown, j: number) => {
        const optPath = `${path}.expansion.contains[${j}]`;

        validateObject(option, optPath);

        validateString(option.code, `${optPath}.code`);
        validateString(option.display, `${optPath}.display`);
        validateString(option.system, `${optPath}.system`);

        return {
          value: option.code,
          label: option.display,
          system: option.system,
        };
      });
      optionsMap.set(key, options);
    }
  }

  // Step 6: Parse each question item
  for (let i = 0; i < q.item.length; i++) {
    const item = q.item[i];
    const itemPath = `questionnaire.item[${i}]`;
    const extPath = `${itemPath}.extension`;

    validateObject(item, itemPath);

    validateString(item.linkId, `${itemPath}.linkId`);

    validateString(item.text, `${itemPath}.text`);

    validateString(item.type, `${itemPath}.type`);

    validate(
      typeof item.required === 'boolean' || item.required === undefined,
      `${itemPath}.required`,
      'a boolean or undefined',
      item.required,
    );

    validate(
      item.extension === undefined || Array.isArray(item.extension),
      extPath,
      'an array or undefined',
      item.extension,
    );

    // Determine type and type-specific properties
    const question = ((): Question => {
      const base = {
        id: item.linkId,
        text: item.text,
        required: item.required ?? false,
      };

      const customQuestionType = getCustomQuestionClass(item.extension, extPath);

      switch (item.type) {
        case 'coding': {
          const isMulti = !!item.repeats;

          validate(
            item.answerValueSet === undefined || typeof item.answerValueSet === 'string',
            `${itemPath}.answerValueSet`,
            'a string or undefined',
            item.answerValueSet,
          );

          const options = item.answerValueSet?.startsWith('#')
            ? (optionsMap.get(item.answerValueSet) ?? [])
            : [];

          return {
            ...base,
            type: isMulti ? 'multi-select' : 'single-select',
            options: options,
          };
        }

        case 'date': {
          // Date validation constraints
          const dateRelativeMin = getExtension(item.extension, extPath, 'relativeMin');
          const dateRelativeMax = getExtension(item.extension, extPath, 'relativeMax');
          const dateValidation: DateValidation = parseDateValidation(item, extPath);

          if (dateRelativeMin) {
            const parsed = parseDuration(dateRelativeMin);
            validate(
              parsed !== null,
              `${extPath}.relative-min-value`,
              'ISO8601 Duration (e.g., P3D, -P1Y)',
              dateRelativeMin,
            );
            dateValidation.relativeMin = parsed;
          }
          if (dateRelativeMax) {
            const parsed = parseDuration(dateRelativeMax);
            validate(
              parsed !== null,
              `${extPath}.relative-min-value`,
              'ISO8601 Duration (e.g., P3D, -P1Y)',
              dateRelativeMin,
            );
            dateValidation.relativeMax = parsed;
          }
          return {
            ...base,
            type: customQuestionType === 'year' ? 'year' : 'date',
            validation: Object.keys(dateValidation).length > 0 ? dateValidation : undefined,
          };
        }
        case 'string': {
          return {
            ...base,
            type: 'string',
            validation: parseTextValidation(item, itemPath),
          };
        }

        case 'text': {
          return {
            ...base,
            type: 'text',
            validation: parseTextValidation(item, itemPath),
          };
        }

        case 'decimal': {
          if (customQuestionType === 'scale_numeric') {
            // Slider range configuration
            const range = parseSliderRange(item, extPath);
            const step = getExtension(item.extension, extPath, 'sliderStepSize');
            const stepUrl = SUPPORTED_EXTENSIONS.sliderStepSize.url;
            validate(
              exists(step),
              extPath,
              `extension is missing field ${stepUrl}`,
              item.extension,
            );

            return {
              ...base,
              type: 'scale-numeric',
              range,
              step,
            };
          } else {
            return {
              ...base,
              type: 'decimal',
              validation: parseMinMaxValidation(item, extPath),
            };
          }
        }
        case 'integer': {
          validate(
            customQuestionType === 'scale_ordinal',
            `${extPath}.questionnaire-itemControl`,
            '"scale_ordinal"',
            customQuestionType,
          );
          const range = parseSliderRange(item, extPath);
          // Slider labels
          const intMinLabel = getExtension(item.extension, extPath, 'sliderLabelMin');
          const intMaxLabel = getExtension(item.extension, extPath, 'sliderLabelMax');
          validate(
            exists(intMinLabel) && exists(intMaxLabel),
            `${extPath}`,
            '"slider-label-min" and "slider-label-max" are missing',
            item,
          );
          return {
            ...base,
            type: 'scale-ordinal',
            labels: {
              min: intMinLabel,
              max: intMaxLabel,
            },
            range,
          };
        }
      }
      // Issue 84: Dont throw (e.g. add try, catch or idk) but gracefully exit
      // and mark the Questionnaire as not supported
      throw new Error(`Invalid value at ${itemPath}.type, received ${JSON.stringify(item.type)}`);
    })();

    type ActualTypes = (typeof question)['type'];
    // This checks if all QuestionTypes defined by D4L are also correctly parsed by us
    // @ts-expect-error: Temporarily ignored until all types are implemented
    const _assertAllTypesCovered: [QuestionInputType] extends [ActualTypes] ? true : never = true;

    // Parse conditional display logic
    if (item.enableWhen) {
      validateArray(item.enableWhen, `${itemPath}.enableWhen`);

      if (item.enableWhen.length > 0) {
        const conditions = item.enableWhen.map((condition, j) => {
          const condPath = `${itemPath}.enableWhen[${j}]`;
          validateObject(condition, condPath);

          validateString(condition.operator, `${condPath}.operator`);
          validateString(condition.question, `${condPath}.question`);

          const referencedQuestion = output.questions.find((q) => q.id === condition.question);

          validate(
            exists(referencedQuestion),
            `${condPath}.question`,
            `valid question id`,
            condition.question,
          );

          const questionType = referencedQuestion.type;
          const isMulti = questionType === 'multi-select';

          const operator = mapOperator(condition.operator, isMulti);
          validate(
            operator !== null,
            `${condPath}.operator`,
            'a valid operator',
            condition.operator,
          );

          const answerValue =
            operator !== 'exists' ? getAnswer(condition, condPath, questionType).value : undefined;

          return {
            questionId: condition.question,
            operator: operator,
            value: answerValue,
          };
        });

        const behavior = item.enableBehavior;
        validate(
          behavior === 'all' || behavior === 'any',
          `${itemPath}.enableBehavior`,
          "'all' | 'any'",
          behavior,
        );
        question.showWhen = {
          behavior,
          conditions,
        };
      }
    }

    output.questions.push(question);
  }

  return output;
}
