// Single place to change the activity type list, per the spec's request
// that this be editable later without touching every route.
const ACTIVITY_TYPES = [
  { value: 'SELF_STUDY', label: 'Self Study' },
  { value: 'LECTURE', label: 'Lecture' },
  { value: 'NOTE_MAKING', label: 'Note Making' },
  { value: 'QUESTION_PRACTICE', label: 'Question Practice' },
  { value: 'REVISION', label: 'Revision' },
  { value: 'READING', label: 'Reading' },
  { value: 'OTHER', label: 'Other' },
];

const VALID_VALUES = ACTIVITY_TYPES.map((a) => a.value);

module.exports = { ACTIVITY_TYPES, VALID_VALUES };
