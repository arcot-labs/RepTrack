"""
seed lower body exercises

Revision ID: 95ee94cb9cfc
Revises: 315bd7d1904a
Create Date: 2026-03-27 09:51:42.177699-05:00
"""

from collections.abc import Sequence

from alembic import op

revision: str = "95ee94cb9cfc"
down_revision: str | Sequence[str] | None = "315bd7d1904a"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute(
        """
        INSERT INTO exercises (user_id, name, description)
        VALUES
            -- squats
            (NULL, 'back squat', 'Barbell squat with bar on upper back'),
            (NULL, 'front squat', 'Barbell squat with bar on front shoulders'),
            (NULL, 'goblet squat', 'Squat holding dumbbell or kettlebell at chest'),
            (NULL, 'split squat', 'Stationary lunge in split stance'),
            (NULL, 'bulgarian split squat', 'Rear foot elevated single-leg squat'),
            (NULL, 'hack squat', 'Machine-based squat on angled sled'),

            -- deadlifts
            (NULL, 'romanian deadlift', 'Hip hinge with slight knee bend'),
            (NULL, 'conventional deadlift', 'Barbell lift from floor using hips and legs'),
            (NULL, 'sumo deadlift', 'Wide stance barbell deadlift'),
            (NULL, 'trap bar deadlift', 'Hex bar deadlift with neutral grip'),

            -- machines
            (NULL, 'leg press', 'Machine-based leg pressing movement'),
            (NULL, 'leg extension', 'Machine knee extension for quadriceps'),
            (NULL, 'leg curl', 'Machine knee flexion for hamstrings'),
            (NULL, 'standing calf raise', 'Standing heel raise for calf muscles'),
            (NULL, 'seated calf raise', 'Seated heel raise targeting soleus'),
            (NULL, 'hip abduction', 'Machine movement pushing legs outward'),
            (NULL, 'hip adduction', 'Machine movement pulling legs inward'),

            -- lunges
            (NULL, 'forward lunge', 'Forward stepping lunge movement'),
            (NULL, 'reverse lunge', 'Backward stepping lunge movement'),
            (NULL, 'walking lunge', 'Continuous forward stepping lunges'),

            -- glute focused
            (NULL, 'hip thrust', 'Hip extension with upper back supported'),
            (NULL, 'glute bridge', 'Hip extension from floor position'),
            (NULL, 'cable pull through', 'Cable-based hip hinge movement'),
            (NULL, 'cable glute kickback', 'Cable-based hip extension movement'),
            (NULL, 'step-up', 'Single-leg step onto elevated platform'),

            -- posterior chain
            (NULL, 'nordic curl', 'Eccentric hamstring lowering movement'),
            (NULL, 'good morning', 'Hip hinge with bar on upper back'),
            (NULL, 'back extension', 'Spinal extension on hyperextension bench')
        ON CONFLICT (user_id, name)
        DO UPDATE SET
            description = EXCLUDED.description
        """
    )

    op.execute(
        """
        INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id)
        VALUES
            -- squats
            ((SELECT id FROM exercises WHERE user_id IS NULL AND name = 'back squat'), (SELECT id FROM muscle_groups WHERE name = 'quads')),
            ((SELECT id FROM exercises WHERE user_id IS NULL AND name = 'back squat'), (SELECT id FROM muscle_groups WHERE name = 'glutes')),
            ((SELECT id FROM exercises WHERE user_id IS NULL AND name = 'back squat'), (SELECT id FROM muscle_groups WHERE name = 'lower back')),

            ((SELECT id FROM exercises WHERE user_id IS NULL AND name = 'front squat'), (SELECT id FROM muscle_groups WHERE name = 'quads')),
            ((SELECT id FROM exercises WHERE user_id IS NULL AND name = 'front squat'), (SELECT id FROM muscle_groups WHERE name = 'glutes')),
            ((SELECT id FROM exercises WHERE user_id IS NULL AND name = 'front squat'), (SELECT id FROM muscle_groups WHERE name = 'abs')),

            ((SELECT id FROM exercises WHERE user_id IS NULL AND name = 'goblet squat'), (SELECT id FROM muscle_groups WHERE name = 'quads')),
            ((SELECT id FROM exercises WHERE user_id IS NULL AND name = 'goblet squat'), (SELECT id FROM muscle_groups WHERE name = 'glutes')),

            ((SELECT id FROM exercises WHERE user_id IS NULL AND name = 'split squat'), (SELECT id FROM muscle_groups WHERE name = 'quads')),
            ((SELECT id FROM exercises WHERE user_id IS NULL AND name = 'split squat'), (SELECT id FROM muscle_groups WHERE name = 'glutes')),

            ((SELECT id FROM exercises WHERE user_id IS NULL AND name = 'bulgarian split squat'), (SELECT id FROM muscle_groups WHERE name = 'quads')),
            ((SELECT id FROM exercises WHERE user_id IS NULL AND name = 'bulgarian split squat'), (SELECT id FROM muscle_groups WHERE name = 'glutes')),

            ((SELECT id FROM exercises WHERE user_id IS NULL AND name = 'hack squat'), (SELECT id FROM muscle_groups WHERE name = 'quads')),
            ((SELECT id FROM exercises WHERE user_id IS NULL AND name = 'hack squat'), (SELECT id FROM muscle_groups WHERE name = 'glutes')),

            -- deadlifts
            ((SELECT id FROM exercises WHERE user_id IS NULL AND name = 'romanian deadlift'), (SELECT id FROM muscle_groups WHERE name = 'hamstrings')),
            ((SELECT id FROM exercises WHERE user_id IS NULL AND name = 'romanian deadlift'), (SELECT id FROM muscle_groups WHERE name = 'glutes')),
            ((SELECT id FROM exercises WHERE user_id IS NULL AND name = 'romanian deadlift'), (SELECT id FROM muscle_groups WHERE name = 'lower back')),

            ((SELECT id FROM exercises WHERE user_id IS NULL AND name = 'conventional deadlift'), (SELECT id FROM muscle_groups WHERE name = 'glutes')),
            ((SELECT id FROM exercises WHERE user_id IS NULL AND name = 'conventional deadlift'), (SELECT id FROM muscle_groups WHERE name = 'hamstrings')),
            ((SELECT id FROM exercises WHERE user_id IS NULL AND name = 'conventional deadlift'), (SELECT id FROM muscle_groups WHERE name = 'lower back')),

            ((SELECT id FROM exercises WHERE user_id IS NULL AND name = 'sumo deadlift'), (SELECT id FROM muscle_groups WHERE name = 'glutes')),
            ((SELECT id FROM exercises WHERE user_id IS NULL AND name = 'sumo deadlift'), (SELECT id FROM muscle_groups WHERE name = 'adductors')),

            ((SELECT id FROM exercises WHERE user_id IS NULL AND name = 'trap bar deadlift'), (SELECT id FROM muscle_groups WHERE name = 'quads')),
            ((SELECT id FROM exercises WHERE user_id IS NULL AND name = 'trap bar deadlift'), (SELECT id FROM muscle_groups WHERE name = 'glutes')),

            -- machines
            ((SELECT id FROM exercises WHERE user_id IS NULL AND name = 'leg press'), (SELECT id FROM muscle_groups WHERE name = 'quads')),
            ((SELECT id FROM exercises WHERE user_id IS NULL AND name = 'leg press'), (SELECT id FROM muscle_groups WHERE name = 'glutes')),

            ((SELECT id FROM exercises WHERE user_id IS NULL AND name = 'leg extension'), (SELECT id FROM muscle_groups WHERE name = 'quads')),
            ((SELECT id FROM exercises WHERE user_id IS NULL AND name = 'leg curl'), (SELECT id FROM muscle_groups WHERE name = 'hamstrings')),

            ((SELECT id FROM exercises WHERE user_id IS NULL AND name = 'standing calf raise'), (SELECT id FROM muscle_groups WHERE name = 'calves')),
            ((SELECT id FROM exercises WHERE user_id IS NULL AND name = 'seated calf raise'), (SELECT id FROM muscle_groups WHERE name = 'calves')),

            ((SELECT id FROM exercises WHERE user_id IS NULL AND name = 'hip abduction'), (SELECT id FROM muscle_groups WHERE name = 'abductors')),
            ((SELECT id FROM exercises WHERE user_id IS NULL AND name = 'hip adduction'), (SELECT id FROM muscle_groups WHERE name = 'adductors')),

            -- lunges
            ((SELECT id FROM exercises WHERE user_id IS NULL AND name = 'forward lunge'), (SELECT id FROM muscle_groups WHERE name = 'quads')),
            ((SELECT id FROM exercises WHERE user_id IS NULL AND name = 'forward lunge'), (SELECT id FROM muscle_groups WHERE name = 'glutes')),

            ((SELECT id FROM exercises WHERE user_id IS NULL AND name = 'reverse lunge'), (SELECT id FROM muscle_groups WHERE name = 'glutes')),
            ((SELECT id FROM exercises WHERE user_id IS NULL AND name = 'reverse lunge'), (SELECT id FROM muscle_groups WHERE name = 'quads')),

            ((SELECT id FROM exercises WHERE user_id IS NULL AND name = 'walking lunge'), (SELECT id FROM muscle_groups WHERE name = 'quads')),
            ((SELECT id FROM exercises WHERE user_id IS NULL AND name = 'walking lunge'), (SELECT id FROM muscle_groups WHERE name = 'glutes')),

            -- glute focused
            ((SELECT id FROM exercises WHERE user_id IS NULL AND name = 'hip thrust'), (SELECT id FROM muscle_groups WHERE name = 'glutes')),
            ((SELECT id FROM exercises WHERE user_id IS NULL AND name = 'glute bridge'), (SELECT id FROM muscle_groups WHERE name = 'glutes')),

            ((SELECT id FROM exercises WHERE user_id IS NULL AND name = 'cable pull through'), (SELECT id FROM muscle_groups WHERE name = 'glutes')),
            ((SELECT id FROM exercises WHERE user_id IS NULL AND name = 'cable pull through'), (SELECT id FROM muscle_groups WHERE name = 'hamstrings')),

            ((SELECT id FROM exercises WHERE user_id IS NULL AND name = 'cable glute kickback'), (SELECT id FROM muscle_groups WHERE name = 'glutes')),

            ((SELECT id FROM exercises WHERE user_id IS NULL AND name = 'step-up'), (SELECT id FROM muscle_groups WHERE name = 'quads')),
            ((SELECT id FROM exercises WHERE user_id IS NULL AND name = 'step-up'), (SELECT id FROM muscle_groups WHERE name = 'glutes')),

            -- posterior chain
            ((SELECT id FROM exercises WHERE user_id IS NULL AND name = 'nordic curl'), (SELECT id FROM muscle_groups WHERE name = 'hamstrings')),

            ((SELECT id FROM exercises WHERE user_id IS NULL AND name = 'good morning'), (SELECT id FROM muscle_groups WHERE name = 'hamstrings')),
            ((SELECT id FROM exercises WHERE user_id IS NULL AND name = 'good morning'), (SELECT id FROM muscle_groups WHERE name = 'lower back')),

            ((SELECT id FROM exercises WHERE user_id IS NULL AND name = 'back extension'), (SELECT id FROM muscle_groups WHERE name = 'lower back')),
            ((SELECT id FROM exercises WHERE user_id IS NULL AND name = 'back extension'), (SELECT id FROM muscle_groups WHERE name = 'glutes'))

        ON CONFLICT (exercise_id, muscle_group_id)
        DO NOTHING;
        """
    )


def downgrade() -> None:
    op.execute(
        """
        DELETE FROM exercises
        WHERE user_id IS NULL
          AND name IN (
              'back squat',
              'front squat',
              'goblet squat',
              'split squat',
              'bulgarian split squat',
              'hack squat',
              'romanian deadlift',
              'conventional deadlift',
              'sumo deadlift',
              'trap bar deadlift',
              'leg press',
              'leg extension',
              'leg curl',
              'standing calf raise',
              'seated calf raise',
              'hip abduction',
              'hip adduction',
              'forward lunge',
              'reverse lunge',
              'walking lunge',
              'hip thrust',
              'glute bridge',
              'cable pull through',
              'cable glute kickback',
              'step-up',
              'nordic curl',
              'good morning',
              'back extension'
          )
        """
    )
