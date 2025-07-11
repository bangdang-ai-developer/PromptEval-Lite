"""add_prompt_versioning

Revision ID: f2b4a1fdff57
Revises: 10b8c79b342f
Create Date: 2025-07-11 16:06:33.843792

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'f2b4a1fdff57'
down_revision: Union[str, None] = '10b8c79b342f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create prompt_versions table to track all versions of a prompt
    op.create_table('prompt_versions',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('prompt_id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('version_number', sa.Integer(), nullable=False),
        sa.Column('prompt', sa.Text(), nullable=False),
        sa.Column('enhanced_prompt', sa.Text(), nullable=True),
        sa.Column('name', sa.String(length=255), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('category', sa.String(length=50), nullable=True),
        sa.Column('tags', sa.JSON(), nullable=True),
        sa.Column('domain', sa.String(length=100), nullable=True),
        sa.Column('model_used', sa.String(length=100), nullable=False),
        sa.Column('test_results', sa.JSON(), nullable=True),
        sa.Column('overall_score', sa.Float(), nullable=True),
        sa.Column('improvements', sa.JSON(), nullable=True),
        sa.Column('execution_time', sa.Float(), nullable=True),
        sa.Column('token_usage', sa.JSON(), nullable=True),
        sa.Column('is_template', sa.Boolean(), nullable=False, default=False),
        sa.Column('template_variables', sa.JSON(), nullable=True),
        sa.Column('change_summary', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['prompt_id'], ['prompt_history.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('prompt_id', 'version_number', name='uq_prompt_version')
    )
    op.create_index(op.f('ix_prompt_versions_prompt_id'), 'prompt_versions', ['prompt_id'], unique=False)
    op.create_index(op.f('ix_prompt_versions_user_id'), 'prompt_versions', ['user_id'], unique=False)
    op.create_index(op.f('ix_prompt_versions_created_at'), 'prompt_versions', ['created_at'], unique=False)
    
    # Add version tracking columns to prompt_history
    op.add_column('prompt_history', sa.Column('current_version', sa.Integer(), nullable=False, server_default='1'))
    op.add_column('prompt_history', sa.Column('version_count', sa.Integer(), nullable=False, server_default='1'))
    op.add_column('prompt_history', sa.Column('last_modified_at', sa.DateTime(), nullable=True))


def downgrade() -> None:
    # Remove version tracking columns from prompt_history
    op.drop_column('prompt_history', 'last_modified_at')
    op.drop_column('prompt_history', 'version_count')
    op.drop_column('prompt_history', 'current_version')
    
    # Drop prompt_versions table
    op.drop_index(op.f('ix_prompt_versions_created_at'), table_name='prompt_versions')
    op.drop_index(op.f('ix_prompt_versions_user_id'), table_name='prompt_versions')
    op.drop_index(op.f('ix_prompt_versions_prompt_id'), table_name='prompt_versions')
    op.drop_table('prompt_versions')
