# Questionniare JSON object

The questionniare object contains the following fields:

- `name`: This field contains a unique identifier of the questionnare as a string.
- `title`: This field contains the title of the questionnare that will be displayed to the user.
- `version`: This field contains the version.
- `questions`: This field contains an array of questions.

## Question JSON object

The question object contains the following fields:

- `id`: This field contains a unique identifier for each question as a string.
- `text`: This field contains the question that will be displayed to the user.
- `required`: A boolean that indicates if the question is required or not.
- `type`: A string that determines the type of the question.
- `showWhen` (optional): This field contains a JSON object when the question is dependent on a different question.
  Contains the following fields:
  - `behavior`: A string that is either `any` or `all`.
  - `conditions`: An array of objects containing the following fields:
    - `quesionId`: The unique identifier to the question that the condition is depending on.
    - `operator`: A string that is either:
      - `equals` (or `includes` for multi-choice quesions)
      - `not-equals` (or `not-includes` for multi-choice questions)
      - `less-than`
      - `less-than-or-equal`
      - `greater-than`
      - `greater-than-or-equal`
      - `exists`
    - `value`: Only required if the operator is not `exists`. It contains the value that should be compared to.
- `validation` (optional): An object that contains optional validation options:
  - `minLength` and `maxLength` (optional): A number, requires question type `string` or `text`
  - `min` and `max` (optional): A number if type is `decimal`
    or a date string if type is `date` (YYYY-MM-DD) or `year` (YYYY)
  - `relativeMin` and `relativeMax` (optional): Requires `date` or `year` and restricts the date relative to the current date.
    It is an object with the folowing fields:
    - `value`: A positive or negative number
    - `unit`: Either `days`, `weeks`, `months` or `years`
- `range` (required by type `scale-ordinal` and `scale-numeric`): containing the fields `min` and `max`,
- `step` (required by type `scale-numeric`): determines the step size of the slider.
- `label` (required by type `scale-ordinal`): containing the fields `min` and `max`.
  Both contain strings that that label the start and the end of the slider.
- `options` (required by type `single-select` and `multi-select`): Requires the choice types
  and contains an array of objects with the fields `value`, `label` and `system`.

## Question types

- `decimal`
- `date`
- `year`
- `string`: Short text input, one line
- `text`: Larger text field, multiple lines allowed
- `scale-numeric`: A slider, requires the field `range`
- `scale-ordinal`: A slider, requires the field `range`
- `single-select`: A single choice question, requires a non-empty `options` field
- `multi-select`: A multi choice question, requires a non-empty `options` field

## Not supported question types (as of 30th May 2026)

- `matrix`
- `list`
- `scale-likert`
- `geo-location`
- `country`
- `postal-code`
- `group`
- `display`
