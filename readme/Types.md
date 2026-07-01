## Types

The type documentation is generated automatically from the `src/types` files.
Update the types by running `yarn run readme:update`.

<!-- AUTOMATICALLY GENERATED CONTENT -->

### Program

| Properties  | Required | Type                                        | Description                                                                                                                                                                                |
| ----------- | -------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| name        | true     | string                                      | Name of the program used as primary identifier                                                                                                                                             |
| tenantID    | true     | string                                      | Tenant the program belongs to                                                                                                                                                              |
| languages   | true     | string[]                                    | Language codes that the program is available in. Example: `['en', 'de']`                                                                                                                   |
| type        | true     | `study` or `sensor`                         | `sensor` is the new research-studio type, `study` is from the study-builder (and older)                                                                                                    |
| phases      | true     | [ProgramStep](#ProgramStep)[][]             | Defines the flow of the program as an array of `phases`. `phases` consist of arrays of `steps`. `phases` are worked through sequentially and `steps` within a single `phase` are parallel. |
| donation    | true     | [ProgramDonation](#ProgramDonation)         | Donation settings handle which resources are donated, where they are donated to, and how the donation is regulated                                                                         |
| content     | true     | [ProgramContent](#ProgramContent)           | Contains all the relevant content properties of the program.                                                                                                                               |
| endDate     | false    | ISO 8601 date with timezone                 | Date the program should finish for all users.                                                                                                                                              |
| tags        | false    | [ProgramTag](#ProgramTag)[]                 | List of supported tags including their configuration                                                                                                                                       |
| publishedAt | true     | ISO 8601 date with timezone                 | Date the program was published (used to determine program state).                                                                                                                          |
| featured    | true     | [ProgramFeatured](#ProgramFeatured)         | Describes the featured state of the program.                                                                                                                                               |
| theme       | false    | 'D4L', 'GREEN', 'PURPLE', 'OLIVE' or 'BLUE' | The theme to be used for the program in the app                                                                                                                                            |

#### ProgramFeatured

| Properties             | Required | Type             | Description                                                                      |
| ---------------------- | -------- | ---------------- | -------------------------------------------------------------------------------- |
| enabled                | true     | boolean          | Denotes if the program is featured                                               |
| showProgramImage       | false    | boolean          | Denotes if the program image should be shown                                     |
| showInstituteImage     | false    | boolean          | Denotes if the institute image should be shown                                   |
| showContactInformation | false    | boolean          | Denotes if the contact information should be shown                               |
| showSensors            | false    | boolean          | Denotes if the sensors should be shown                                           |
| estimatedEffort        | false    | object           | The estimated effort for the program                                             |
| description            | false    | TranslatedString | Shown as short description in featured listing (required if featured is enabled) |

### ProgramSteps

#### Base

| Properties        | Required | Type                            | Description                                                                                                                              |
| ----------------- | -------- | ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| type              | true     | string                          | Defines the type of the step (determines which other attributes are applicable)                                                          |
| required          | true     | boolean                         | Defines if the step needs to be completed for the containing phase to count as completed                                                 |
| start             | false    | [StepCondition](#StepCondition) | Defines condition that starts the step. Using this condition with a survey means there will be an indiviual starting date for each user. |
| end               | false    | [StepCondition](#StepCondition) | Defines condition that ends the step. Using this condition with a survey means there will be an indiviual ending date for each user.     |
| requiredCondition | false    | [StepCondition](#StepCondition) | Defines condition that overwrites the required property with the evaluation result.                                                      |

#### Consent Step

| Properties | Required | Type      | Description                                                           |
| ---------- | -------- | --------- | --------------------------------------------------------------------- |
| type       | true     | `consent` | Step that requires a consent to be given                              |
| consentKey | true     | string    | Identifies which consent this step refers to                          |
| minVersion | false    | number    | Denotes the minimum version of the consent which needs to be accepted |

#### Token Step

| Properties  | Required | Type    | Description                                                   |
| ----------- | -------- | ------- | ------------------------------------------------------------- |
| type        | true     | `token` | Step that requires a token (participation code) to be entered |
| tokenLength | true     | number  | number of characters in the token                             |

#### Survey Step

| Properties | Required | Type     | Description                                                                                      |
| ---------- | -------- | -------- | ------------------------------------------------------------------------------------------------ |
| type       | true     | `survey` | Step that requires a survey to be answered at least once                                         |
| surveyName | true     | string   | Identifies which survey this step refers to                                                      |
| standalone | false    | boolean  | Denotes if this survey is a standalone survey that does not belong to this program specifically. |

#### Routine Step

| Properties  | Required | Type      | Description                                               |
| ----------- | -------- | --------- | --------------------------------------------------------- |
| type        | true     | `routine` | Step that requires a routine to be executed at least once |
| routineName | true     | string    | Identifies which routine this step refers to              |

#### Display Step

| Properties  | Required | Type      | Description                                                     |
| ----------- | -------- | --------- | --------------------------------------------------------------- |
| type        | true     | `display` | Step that requires a display to be shown                        |
| displayName | true     | string    | Identifies which display this step refers to                    |
| isCompleted | false    | boolean   | If true marks the program as completed once this step is shown. |

#### Eligibility Step

| Properties | Required | Type                    | Description                                                                                                        |
| ---------- | -------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------ |
| type       | true     | `eligbility`            | Step that requires an eligibility test to be passed                                                                |
| surveyName | true     | string                  | Identifies which survey is asked for eligibility determination                                                     |
| threshold  | true     | [Threshold](#Threshold) | required for type `eligibility` - Defines the score condition that must be fulfilled to pass the eligibility test. |
| standalone | false    | boolean                 | Denotes if the survey for this eligbility step is one that does not belong to this program specifically.           |

##### Threshold

| Properties | Required | Type                                              | Description                                                             |
| ---------- | -------- | ------------------------------------------------- | ----------------------------------------------------------------------- |
| operator   | true     | `exists`, `eq`, `neq`, `lt`, `lteq`, `gt`, `gteq` | Defines the operator to use for the threshold                           |
| value      | true     | number                                            | Defines the number to be used with the operator to define the threshold |

#### Sensor Step

| Properties | Required | Type                                | Description                                                                         |
| ---------- | -------- | ----------------------------------- | ----------------------------------------------------------------------------------- |
| type       | true     | `sensor`                            | Step that sets up passive data collection                                           |
| devices    | true     | [ProgramDevices](#ProgramDevices)[] | List of supported devices including their configuration for passive data collection |

### StepCondition

| Properties   | Required | Type                                | Description                                                                                                                                                                                                                                         |
| ------------ | -------- | ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| type         | true     | [ConditionType](#ConditionType)     | Type of the condition (determines which other attributes are applicable)                                                                                                                                                                            |
| surveyName   | false    | string                              | required for condition type `survey` and `question`                                                                                                                                                                                                 |
| routineName  | false    | string                              | required for condition type `routine`                                                                                                                                                                                                               |
| linkID       | false    | string                              | required for condition type `question`                                                                                                                                                                                                              |
| questionType | false    | `coding`, `date`                    | required for condition type `question` - defines the data type of the referred to question                                                                                                                                                          |
| operand      | false    | string                              | required for condition type `question` (unless operator is `exists`). Used as `<answer>` `<operator>` `<operand>`.                                                                                                                                  |
| operator     | false    | `exists`,`=`,`!=`,`>`,`<`,`>=`,`<=` | Required for condition type `question`. Used as `<answer>` `<operator>` `<operand>`.                                                                                                                                                                |
| offset       | false    | ISO 8601 duration string            | Defines the offset between the answer date and the current date. For question type `coding` only impacts the start/end date calculation. For type `offset` impacts the `item`. For type `consent`, this is applied to the date of the consent grant |
| item         | false    | StepCondition                       | Required for condition type `not` and `offset`.                                                                                                                                                                                                     |
| items        | false    | StepCondition[]                     | Required for condition type `and` and `or`. List of conditions that are combined with the respective operator.                                                                                                                                      |
| sorting      | false    | `earliest`, `latest`                | Used for condition type `and` and `or`. Determines which resulting dates of the items gets picked. Defaults to `earliest` for `or` and `latest` for `and`.                                                                                          |
| consentKey   | false    | string                              | Required for condition type `consent`. Reference to the consent that must have been granted to fulfill the condition.                                                                                                                               |

#### ConditionType

| Type     | Description                                                                         |
| -------- | ----------------------------------------------------------------------------------- |
| question | Condition that requires a specific answer from a previous survey                    |
| survey   | Condition that requires a previous survey to have been completed                    |
| routine  | Condition that requires a previous routine to have been completed                   |
| and      | Condition that requires all subconditions to be fulfilled                           |
| or       | Condition that requires one subcondition to be fulfilled                            |
| offset   | Condition that adds a date offset to the fulfillment date of the given subcondition |
| consent  | Condition that require a specific consent to be given                               |

### ProgramDonation

| Properties             | Required | Type                                          | Description                                                                                     |
| ---------------------- | -------- | --------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| donation.consentKey    | false    | string                                        | The consent key identifying the consent the user has to sign for data donation in this program. |
| donation.delay         | true     | number                                        | The number of days after which a resource can be donated.                                       |
| donation.revocation    | true     | `delete`, `anonymize`                         | Determines what happens to the data after donation was revoked. Defaults to `delete`.           |
| donation.anonymization | false    | [ProgramAnonymization](#ProgramAnonymization) | The set of the anonymization functions which should be applied to all resources of the program. |
| donation.target        | true     | string                                        | The target which should be used for data donation.                                              |

#### ProgramAnonymization

| Properties    | Required | Type                                          | Description                                                                                                            |
| ------------- | -------- | --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| blur          | false    | object                                        | The set of blurring settings that should be applied to the resource.                                                   |
| blur.location | true     | string                                        | The timezone location of the resource, e.g `"Europe/Berlin"`.                                                          |
| blur.authored | false    | [DateBlurringFunction](#DateBlurringFunction) | The name of the default blurring function which is used to blur the authored timestamp of every QuestionnaireResponse. |
| blur.authored | false    | [DateBlurringFunction](#DateBlurringFunction) | The name of the default blurring function which is used to blur the period start and end of every ResearchSubject.     |

#### DateBlurringFunction

| Type         | Description                                      |
| ------------ | ------------------------------------------------ |
| startOfDay   | Sets time to the start of the day (00:00:00)     |
| endOfDay     | Sets time to the end of the day (23:59:59.99...) |
| startOfWeek  | Sets date to the start of monday                 |
| endOfWeek    | Sets date to the end of sunday                   |
| startOfMonth | Sets date to the start of the first of the month |
| endOfMonth   | Sets date to the end of the last of th month     |

#### ProgramContent

| Properties               | Required | Type                              | Description                                              |
| ------------------------ | -------- | --------------------------------- | -------------------------------------------------------- |
| title                    | true     | {language: string}                | Display title of the program.                            |
| description              | true     | {language: string}                | Display description of the program.                      |
| contact                  | true     | {language: string}                | Contact information to display for the user.             |
| contactInfo              | true     | [ProgramContact](#ProgramContact) | Contact information to display for the user.             |
| image                    | false    | string                            | Image of the program                                     |
| institute                | false    | object                            | requires `name` if `image` is set                        |
| privacyPolicy            | false    | object                            | requires `text`                                          |
| participationInformation | false    | object                            | requires `text`                                          |
| eligibility              | false    | object                            | requires `title`, `description`, `include` and `exclude` |

#### ProgramContact

| Properties | Required | Type   | Description                             |
| ---------- | -------- | ------ | --------------------------------------- |
| email      | false    | string | Email address to contact for questions. |
| phone      | false    | string | Phone number to contact for questions.  |

#### ProgramTag

| Properties    | Required | Type                              | Description                                     |
| ------------- | -------- | --------------------------------- | ----------------------------------------------- |
| code          | true     | string                            | The code identifying this tag                   |
| labels        | true     | TranslatedString                  | Set of human readable translations for this tag |
| effectiveType | true     | 'dateTime', 'period' or 'unknown' | The type of tag                                 |

### Survey

| Properties  | Required | Type                            | Description                                                                                             |
| ----------- | -------- | ------------------------------- | ------------------------------------------------------------------------------------------------------- |
| name        | true     | string                          | Primary identifier. Assumption: survey and routine names are collectively unique                        |
| programName | true     | string                          | The name of the program the survey belongs to                                                           |
| frequency   | true     | [TaskFrequency](#TaskFrequency) | Defines in which frequency the questionnaire occurs                                                     |
| scoring     | true     | [SurveyScoring](#SurveyScoring) | Defines the texts, images and icons that need to be displayed for the survey                            |
| content     | true     | [SurveyContent](#SurveyContent) | Defines the texts, images and icons that need to be displayed for the survey                            |
| reminder    | false    | [TaskReminder](#TaskReminder)   | Defines if and when a reminder should be sent for the task (only for one-time and recurring tasks)      |
| template    | false    | string                          | Name of the template used for the questionnaire (templated surveys don't allow questions to be changed) |

#### TaskFrequency

| Properties       | Required | Type                            | Description                                                                                                                                                                                                                             |
| ---------------- | -------- | ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| type             | true     | [FrequencyType](#FrequencyType) | Defines how often and when a questionnaire is triggered/added for the survey                                                                                                                                                            |
| start            | true     | ISO 8601 date with timezone     | Determines the global starting date of the survey. The time component is also used for when the events should be available on the day they become available.                                                                            |
| end              | false    | ISO 8601 date with timezone     | Determines the global ending date of the survey.                                                                                                                                                                                        |
| location         | false    | Timezone Location               | Determines the location for the defined date, so that timezone problems can be handled.                                                                                                                                                 |
| factor           | false    | integer                         | For `daily`, `weekly` and `monthly` this factor is used to manipulate the cycle length, e.g. `daily` with a factor of 7 makes it a survey that is repeated every week, but doesn't necessarily start on monday.                         |
| editDuration     | false    | ISO 8601 duration string        | Enables editing events of this survey for the given duration.                                                                                                                                                                           |
| skipFirst        | false    | boolean                         | Determines if the first iteration of the survey after subscription should be skipped. Skipping it means the questionnaire won't open in the middle of the window and instead at the start of the next full window. Defaults to `false`. |
| retainCTAs       | false    | number                          | Allows configuring that x amount of previous CTAs remain active on the todo screen.                                                                                                                                                     |
| allowAddOnDemand | false    | boolean                         | If true allows the task to also be added at any point in time (on demand).                                                                                                                                                              |

#### TaskReminder

| Properties | Required | Type                                            | Description                                                                                        |
| ---------- | -------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| frequency  | true     | [ReminderFrequencyType](#ReminderFrequencyType) | Defines if and when a reminder should be sent for the task (only for one-time and recurring tasks) |

#### SurveyScoring

| Properties      | Required | Type                                          | Description                                                                        |
| --------------- | -------- | --------------------------------------------- | ---------------------------------------------------------------------------------- |
| scores          | true     | object                                        | Defines how the questions will be scored                                           |
| scores.valueset | false    | {valuesetURL: {answerCode: score}}            | For questions that use valuesets scores are assigned to each code of the valuesets |
| scores.number   | false    | {linkId: [ScoreThreshold](#ScoreThreshold)[]} | For numeric questions we define scoring conditions per question                    |

#### ScoreThreshold

| Properties | Required | Type                             | Description                                                          |
| ---------- | -------- | -------------------------------- | -------------------------------------------------------------------- |
| operator   | true     | `eq`, `lt`, `lteq`, `gt`, `gteq` | Defines the operator to use with the threshold                       |
| threshold  | true     | number                           | Threshold that is used with the operator                             |
| score      | true     | number                           | Score that is added when the operator and threshold condition is met |

#### FrequencyType

| Type     | Description                                               |
| -------- | --------------------------------------------------------- |
| single   | Occurs only once                                          |
| daily    | Occurs every day                                          |
| weekly   | Occurs every Monday                                       |
| monthly  | Occurs every 1st of a month                               |
| onDemand | There is a button that allows you to add one at any point |

#### ReminderFrequencyType

| Type         | Description                                                                         |
| ------------ | ----------------------------------------------------------------------------------- |
| daily        | A reminder will be sent daily                                                       |
| beforeExpiry | A reminder will be sent when the task is about to expire (last day it is available) |

#### SurveyContent

| Properties          | Required | Type                 | Description                                |
| ------------------- | -------- | -------------------- | ------------------------------------------ |
| default             | true     | object               | Default values for survey texts and images |
| default.title       | true     | {[language]: text}   | Survey title in available languages        |
| default.description | false    | {[language]: text}   | Survey description in available languages  |
| default.image       | false    | data URI encoded svg | Survey image in html usable format         |
| default.icon        | false    | data URI encoded svg | Survey icon in html usable format          |

### Routine

| Properties  | Required                 | Type                                | Description                                                                                        |
| ----------- | ------------------------ | ----------------------------------- | -------------------------------------------------------------------------------------------------- |
| name        | true                     | string                              | Primary identifier. Assumption: survey and routine names are collectively unique                   |
| programName | true                     | string                              | The name of the program the routine belongs to                                                     |
| frequency   | true                     | [TaskFrequency](#TaskFrequency)     | Defines in which frequency the questionnaire occurs                                                |
| content     | true                     | [RoutineContent](#RoutineContent)   | Defines the texts, images and icons that need to be displayed for the routine                      |
| devices     | true                     | string[]                            | Lists the devices used in the routine                                                              |
| duration    | ISO 8601 duration String | Defines the duration of the routine |
| reminder    | false                    | [TaskReminder](#TaskReminder)       | Defines if and when a reminder should be sent for the task (only for one-time and recurring tasks) |

#### ProgramDevice

| Properties    | Required | Type                                                | Description                                                                                                                       |
| ------------- | -------- | --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| type          | true     | [ProgramDeviceType](#ProgramDeviceType)             | Device identifier                                                                                                                 |
| dataTypes     | true     | [ProgramDevicesDataType](#ProgramDevicesDataType)[] | List of data types to collect                                                                                                     |
| labels        | true     | [ProgramDevicesLabel](#ProgramDevicesLabel)[]       | List of labels                                                                                                                    |
| outputRate    | false    | number                                              | Sampling rate in hz                                                                                                               |
| sensorDelay   | false    | number                                              | Sensor delay as per Android constants https://developer.android.com/reference/android/hardware/SensorManager#SENSOR_DELAY_FASTEST |
| streamingMode | false    | string                                              | Device specific streaming mode to use for data types                                                                              |
| clientID      | false    | string                                              | ClientID required to request data via API                                                                                         |
| clientTarget  | false    | `prod`/`sandbox`                                    | Identifier which URL set to use for API communication. Defaults to prod if unset                                                  |

#### RoutineContent

| Properties    | Required | Type                                        | Description                                 |
| ------------- | -------- | ------------------------------------------- | ------------------------------------------- |
| default       | true     | object                                      | Default values for routine texts and images |
| default.title | true     | {[language]: text}                          | Routine title in available languages        |
| steps         | true     | [RoutineContentStep[]](#RoutineContentStep) | Routine steps                               |

#### RoutineContentStep

| Properties | Required | Type                                             | Description                                  |
| ---------- | -------- | ------------------------------------------------ | -------------------------------------------- |
| title      | true     | {[language]: text}                               | Step title in available languages            |
| blocks     | true     | {image?: text, instructions: {[language]: text}} | Step blocks including image and instructions |

### Display

| Properties  | Required | Type                                                      | Description                                                                      |
| ----------- | -------- | --------------------------------------------------------- | -------------------------------------------------------------------------------- |
| name        | true     | string                                                    | Primary identifier. Assumption: survey and display names are collectively unique |
| programName | true     | string                                                    | The name of the program the display belongs to                                   |
| displayType | true     | 'report' / 'recommendation'                               | The type of the display (report or recommendation)                               |
| frequency   | true     | [TaskFrequency](#TaskFrequency)                           | Defines in which frequency the questionnaire occurs                              |
| content     | true     | [DisplayContent](#DisplayContent)                         | Defines the texts, images and icons that need to be displayed for the display    |
| charts      | false    | { [key in ProgramDeviceType]?: ProgramDevicesDataType[] } | List of devices and their data types that are relevant for the display           |

#### DisplayContent

| Properties      | Required | Type                  | Description                                 |
| --------------- | -------- | --------------------- | ------------------------------------------- |
| default         | true     | object                | Default values for display texts and images |
| default.title   | true     | {[language]: text}    | Display title in available languages        |
| default.message | true     | {[language]: text}    | Display message in available languages      |
| blocks          | false    | DisplayContentBlock[] | Content blocks for the display              |

#### DisplayContentBlock

| Properties | Required | Type               | Description                          |
| ---------- | -------- | ------------------ | ------------------------------------ |
| image      | false    | string             | Optional image for the content block |
| text       | true     | {[language]: text} | Block text in available languages    |
