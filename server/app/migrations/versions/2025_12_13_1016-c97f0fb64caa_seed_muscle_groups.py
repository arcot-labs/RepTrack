"""seed muscle groups

Revision ID: c97f0fb64caa
Revises: 1eac280a80f9
Create Date: 2025-12-13 10:16:29.507334-06:00

"""

from collections.abc import Sequence

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "c97f0fb64caa"
down_revision: str | Sequence[str] | None = "1eac280a80f9"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade():
    op.execute(
        """
        INSERT INTO muscle_groups (id, name, description)
        VALUES
            (1, 'chest', 'Muscles of the anterior upper torso primarily responsible for pushing movements of the arms.'),
            (2, 'back', 'Muscles of the posterior torso responsible for pulling movements, spinal support, and posture.'),
            (3, 'arms', 'Muscles of the upper limbs responsible for elbow flexion and extension and assisting pushing and pulling movements.'),
            (4, 'shoulders', 'Muscles surrounding the shoulder joint responsible for arm abduction, rotation, and stabilization.'),
            (5, 'core', 'Muscles of the trunk responsible for spinal stability, posture, and force transfer between upper and lower body.'),
            (6, 'legs', 'Muscles of the hips, thighs, and lower legs responsible for locomotion, squatting, and lower-body force production.')
        ON CONFLICT (id) DO NOTHING
        """
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.execute(
        """
        DELETE FROM muscle_groups
        WHERE id IN (1, 2, 3, 4, 5, 6)
        """
    )
