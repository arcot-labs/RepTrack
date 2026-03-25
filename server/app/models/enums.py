from enum import StrEnum


class AccessRequestStatus(StrEnum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class FeedbackType(StrEnum):
    feedback = "feedback"
    feature = "feature"


class SetUnit(StrEnum):
    kg = "kg"
    lb = "lb"


class SearchIndex(StrEnum):
    MUSCLE_GROUPS = "muscle_groups"
    EXERCISES = "exercises"
