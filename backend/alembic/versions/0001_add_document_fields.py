"""Add document extraction metadata columns to job_analyses

Revision ID: 0001_add_document_fields
Revises:
Create Date: 2026-11-19
"""

from alembic import op
import sqlalchemy as sa

revision = "0001_add_document_fields"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table("job_analyses") as batch_op:
        batch_op.add_column(
            sa.Column("source_type", sa.String(length=24), nullable=False, server_default="manual")
        )
        batch_op.add_column(
            sa.Column("original_filename", sa.String(length=150), nullable=True)
        )
        batch_op.add_column(
            sa.Column("extraction_method", sa.String(length=24), nullable=True)
        )
        batch_op.add_column(
            sa.Column("extracted_payload_json", sa.Text(), nullable=True)
        )
        batch_op.add_column(
            sa.Column("extraction_metadata_json", sa.Text(), nullable=True)
        )


def downgrade() -> None:
    with op.batch_alter_table("job_analyses") as batch_op:
        batch_op.drop_column("extraction_metadata_json")
        batch_op.drop_column("extracted_payload_json")
        batch_op.drop_column("extraction_method")
        batch_op.drop_column("original_filename")
        batch_op.drop_column("source_type")
