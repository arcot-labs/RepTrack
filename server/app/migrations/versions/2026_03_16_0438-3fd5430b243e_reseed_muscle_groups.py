"""
reseed muscle groups

Revision ID: 3fd5430b243e
Revises: 1d1475c06895
Create Date: 2026-03-16 04:38:47.690395-05:00
"""

from collections.abc import Sequence

from alembic import op

revision: str = "3fd5430b243e"
down_revision: str | Sequence[str] | None = "1d1475c06895"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute(
        """
        INSERT INTO muscle_groups (name, description)
        VALUES
            ('forearms', 'Muscles of the lower arm that control grip and wrist movement.'),
            ('biceps', 'Front upper-arm muscles that bend the elbow and help with pulling.'),
            ('triceps', 'Back upper-arm muscles that straighten the elbow and assist pressing.'),
            ('front delts', 'Front shoulder muscles that lift the arm forward.'),
            ('side delts', 'Outer shoulder muscles that raise the arm out to the side.'),
            ('rear delts', 'Back shoulder muscles that pull the arm backward and improve posture.'),
            ('chest', 'Front torso muscles used in pushing and pressing movements.'),
            ('neck', 'Muscles that support head movement and cervical stability.'),
            ('upper traps', 'Upper back/neck muscles that elevate and stabilize the shoulders.'),
            ('upper back', 'Mid-to-upper posterior muscles that retract the shoulder blades.'),
            ('lats', 'Large side-back muscles that pull the arms down and back.'),
            ('lower back', 'Spinal support muscles that extend and stabilize the torso.'),
            ('abs', 'Front core muscles that flex the spine and brace the trunk.'),
            ('obliques', 'Side core muscles that rotate and bend the torso.'),
            ('serratus', 'Side ribcage muscles that stabilize and move the shoulder blades.'),
            ('glutes', 'Hip muscles that drive extension, power, and pelvic stability.'),
            ('quads', 'Front thigh muscles that straighten the knee.'),
            ('hamstrings', 'Back thigh muscles that bend the knee and extend the hip.'),
            ('calves', 'Lower-leg muscles that point the foot and aid walking/running.'),
            ('abductors', 'Outer hip muscles that move the leg away from the body.'),
            ('adductors', 'Inner thigh muscles that move the leg toward the body.'),
            ('tibialis', 'Front shin muscle that lifts the foot upward.')
        ON CONFLICT (name)
        DO UPDATE SET
            description = EXCLUDED.description,
            updated_at = NOW()
        """
    )

    op.execute(
        """
        INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id)
        SELECT emg.exercise_id, new_mg.id
        FROM exercise_muscle_groups emg
        JOIN muscle_groups old_mg
            ON old_mg.id = emg.muscle_group_id
        JOIN muscle_groups new_mg
            ON new_mg.name = CASE old_mg.name
                WHEN 'arms' THEN 'triceps'
                WHEN 'shoulders' THEN 'side delts'
                WHEN 'back' THEN 'lats'
                WHEN 'core' THEN 'abs'
                WHEN 'legs' THEN 'quads'
            END
        WHERE old_mg.name IN ('arms', 'shoulders', 'back', 'core', 'legs')
        ON CONFLICT (exercise_id, muscle_group_id) DO NOTHING
        """
    )

    op.execute(
        """
        DELETE FROM exercise_muscle_groups
        WHERE muscle_group_id IN (
            SELECT id
            FROM muscle_groups
            WHERE name IN ('arms', 'shoulders', 'back', 'core', 'legs')
        )
        """
    )

    op.execute(
        """
        DELETE FROM muscle_groups
        WHERE name IN ('arms', 'shoulders', 'back', 'core', 'legs')
        """
    )


def downgrade() -> None:
    op.execute(
        """
        INSERT INTO muscle_groups (name, description)
        VALUES
            ('back', 'Muscles of the posterior torso responsible for pulling movements, spinal support, and posture.'),
            ('arms', 'Muscles of the upper limbs responsible for elbow flexion and extension and assisting pushing and pulling movements.'),
            ('shoulders', 'Muscles surrounding the shoulder joint responsible for arm abduction, rotation, and stabilization.'),
            ('core', 'Muscles of the trunk responsible for spinal stability, posture, and force transfer between upper and lower body.'),
            ('legs', 'Muscles of the hips, thighs, and lower legs responsible for locomotion, squatting, and lower-body force production.')
        ON CONFLICT (name) DO NOTHING
        """
    )

    op.execute(
        """
        INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id)
        SELECT emg.exercise_id, old_mg.id
        FROM exercise_muscle_groups emg
        JOIN muscle_groups new_mg
            ON new_mg.id = emg.muscle_group_id
        JOIN muscle_groups old_mg
            ON old_mg.name = CASE
                WHEN new_mg.name IN ('forearms', 'biceps', 'triceps') THEN 'arms'
                WHEN new_mg.name IN ('front delts', 'side delts', 'rear delts') THEN 'shoulders'
                WHEN new_mg.name IN ('neck', 'upper traps', 'upper back', 'lats', 'lower back') THEN 'back'
                WHEN new_mg.name IN ('abs', 'obliques', 'serratus') THEN 'core'
                WHEN new_mg.name IN ('glutes', 'quads', 'hamstrings', 'calves', 'abductors', 'adductors', 'tibialis') THEN 'legs'
            END
        WHERE new_mg.name IN (
            'forearms',
            'biceps',
            'triceps',
            'front delts',
            'side delts',
            'rear delts',
            'neck',
            'upper traps',
            'upper back',
            'lats',
            'lower back',
            'abs',
            'obliques',
            'serratus',
            'glutes',
            'quads',
            'hamstrings',
            'calves',
            'abductors',
            'adductors',
            'tibialis'
        )
        ON CONFLICT (exercise_id, muscle_group_id) DO NOTHING
        """
    )

    op.execute(
        """
        DELETE FROM exercise_muscle_groups
        WHERE muscle_group_id IN (
            SELECT id
            FROM muscle_groups
            WHERE name IN (
                'forearms',
                'biceps',
                'triceps',
                'front delts',
                'side delts',
                'rear delts',
                'neck',
                'upper traps',
                'upper back',
                'lats',
                'lower back',
                'abs',
                'obliques',
                'serratus',
                'glutes',
                'quads',
                'hamstrings',
                'calves',
                'abductors',
                'adductors',
                'tibialis'
            )
        )
        """
    )

    op.execute(
        """
        DELETE FROM muscle_groups
        WHERE name IN (
            'forearms',
            'biceps',
            'triceps',
            'front delts',
            'side delts',
            'rear delts',
            'neck',
            'upper traps',
            'upper back',
            'lats',
            'lower back',
            'abs',
            'obliques',
            'serratus',
            'glutes',
            'quads',
            'hamstrings',
            'calves',
            'abductors',
            'adductors',
            'tibialis'
        )
        """
    )
