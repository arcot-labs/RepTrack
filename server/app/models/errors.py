from fastapi import HTTPException, status


class HTTPError(HTTPException):
    status_code: int
    code: str
    detail: str

    def __init__(self):
        if not hasattr(self, "status_code"):
            raise RuntimeError(f"{self.__class__.__name__} must define status_code")

        if not hasattr(self, "code"):
            raise RuntimeError(f"{self.__class__.__name__} must define code")

        if not hasattr(self, "detail"):
            raise RuntimeError(f"{self.__class__.__name__} must define detail")

        super().__init__(
            status_code=self.status_code,
            detail={
                "code": self.code,
                "detail": self.detail,
            },
        )


class AccessRequestNotPending(HTTPError):
    status_code = status.HTTP_400_BAD_REQUEST
    code = "access_request_not_pending"
    detail = "Access request is not pending"


class InvalidToken(HTTPError):
    status_code = status.HTTP_400_BAD_REQUEST
    code = "invalid_token"
    detail = "Invalid or expired token"


class InvalidCredentials(HTTPError):
    status_code = status.HTTP_401_UNAUTHORIZED
    code = "invalid_credentials"
    detail = "Invalid credentials"


class InsufficientPermissions(HTTPError):
    status_code = status.HTTP_403_FORBIDDEN
    code = "insufficient_permissions"
    detail = "Insufficient permissions"


class AccessRequestRejected(HTTPError):
    status_code = status.HTTP_403_FORBIDDEN
    code = "access_request_rejected"
    detail = "Existing access request rejected"


class AccessRequestNotFound(HTTPError):
    status_code = status.HTTP_404_NOT_FOUND
    code = "access_request_not_found"
    detail = "Access request not found"


class MuscleGroupNotFound(HTTPError):
    status_code = status.HTTP_404_NOT_FOUND
    code = "muscle_group_not_found"
    detail = "One or more muscle groups not found"


class ExerciseNotFound(HTTPError):
    status_code = status.HTTP_404_NOT_FOUND
    code = "exercise_not_found"
    detail = "Exercise not found"


class WorkoutNotFound(HTTPError):
    status_code = status.HTTP_404_NOT_FOUND
    code = "workout_not_found"
    detail = "Workout not found"


class WorkoutExerciseNotFound(HTTPError):
    status_code = status.HTTP_404_NOT_FOUND
    code = "workout_exercise_not_found"
    detail = "Workout exercise not found"


class SetNotFound(HTTPError):
    status_code = status.HTTP_404_NOT_FOUND
    code = "set_not_found"
    detail = "Set not found"


class UsernameTaken(HTTPError):
    status_code = status.HTTP_409_CONFLICT
    code = "username_taken"
    detail = "Username taken. Choose another"


class EmailInUse(HTTPError):
    status_code = status.HTTP_409_CONFLICT
    code = "email_in_use"
    detail = "Email in use. Log in"


class AccessRequestPending(HTTPError):
    status_code = status.HTTP_409_CONFLICT
    code = "access_request_pending"
    detail = "Existing access request pending. Wait for approval"


class ExerciseNameConflict(HTTPError):
    status_code = status.HTTP_409_CONFLICT
    code = "exercise_name_conflict"
    detail = "Exercise with this name already exists"


class WorkoutExercisePositionConflict(HTTPError):
    status_code = status.HTTP_409_CONFLICT
    code = "workout_exercise_position_conflict"
    detail = "Workout exercise with this position already exists"


class SetNumberConflict(HTTPError):
    status_code = status.HTTP_409_CONFLICT
    code = "set_number_conflict"
    detail = "Set with this number already exists"
