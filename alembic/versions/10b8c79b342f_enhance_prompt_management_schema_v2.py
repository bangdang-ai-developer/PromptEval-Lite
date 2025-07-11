"""enhance_prompt_management_schema_v2

Revision ID: 10b8c79b342f
Revises: cb5e7329cc1a
Create Date: 2025-07-11 15:20:27.713062

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '10b8c79b342f'
down_revision: Union[str, None] = 'cb5e7329cc1a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Check if prompt_usage_stats table exists
    conn = op.get_bind()
    result = conn.execute(sa.text("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'prompt_usage_stats')"))
    table_exists = result.scalar()
    
    if not table_exists:
        # Create prompt_usage_stats table
        op.create_table('prompt_usage_stats',
            sa.Column('id', sa.UUID(), nullable=False),
            sa.Column('prompt_id', sa.UUID(), nullable=False),
            sa.Column('user_id', sa.UUID(), nullable=False),
            sa.Column('test_score', sa.Float(), nullable=True),
            sa.Column('model_used', sa.String(50), nullable=False),
            sa.Column('used_at', sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(['prompt_id'], ['prompt_history.id'], ),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index('idx_prompt_usage_stats_prompt_id', 'prompt_usage_stats', ['prompt_id'])
    
    # Check which columns exist in prompt_history
    inspector = sa.inspect(conn)
    existing_columns = [col['name'] for col in inspector.get_columns('prompt_history')]
    
    # Add new columns to prompt_history table if they don't exist
    if 'name' not in existing_columns:
        op.add_column('prompt_history', sa.Column('name', sa.String(255), nullable=True))
    if 'description' not in existing_columns:
        op.add_column('prompt_history', sa.Column('description', sa.Text(), nullable=True))
    if 'category' not in existing_columns:
        op.add_column('prompt_history', sa.Column('category', sa.String(50), nullable=True))
    if 'tags' not in existing_columns:
        op.add_column('prompt_history', sa.Column('tags', sa.JSON(), nullable=True))
    if 'is_template' not in existing_columns:
        op.add_column('prompt_history', sa.Column('is_template', sa.Boolean(), server_default='false', nullable=False))
    if 'template_variables' not in existing_columns:
        op.add_column('prompt_history', sa.Column('template_variables', sa.JSON(), nullable=True))
    if 'usage_count' not in existing_columns:
        op.add_column('prompt_history', sa.Column('usage_count', sa.Integer(), server_default='0', nullable=False))
    if 'average_score' not in existing_columns:
        op.add_column('prompt_history', sa.Column('average_score', sa.Float(), nullable=True))
    if 'last_used_at' not in existing_columns:
        op.add_column('prompt_history', sa.Column('last_used_at', sa.DateTime(), nullable=True))
    if 'is_public' not in existing_columns:
        op.add_column('prompt_history', sa.Column('is_public', sa.Boolean(), server_default='false', nullable=False))
    
    # Add indexes for better performance (check if they exist first)
    existing_indexes = [idx['name'] for idx in inspector.get_indexes('prompt_history')]
    if 'idx_prompt_history_name' not in existing_indexes:
        op.create_index('idx_prompt_history_name', 'prompt_history', ['name'])
    if 'idx_prompt_history_category' not in existing_indexes:
        op.create_index('idx_prompt_history_category', 'prompt_history', ['category'])
    if 'idx_prompt_history_is_template' not in existing_indexes:
        op.create_index('idx_prompt_history_is_template', 'prompt_history', ['is_template'])


def downgrade() -> None:
    # Drop indexes
    op.drop_index('idx_prompt_usage_stats_prompt_id', table_name='prompt_usage_stats')
    op.drop_index('idx_prompt_history_is_template', table_name='prompt_history')
    op.drop_index('idx_prompt_history_category', table_name='prompt_history')
    op.drop_index('idx_prompt_history_name', table_name='prompt_history')
    
    # Drop prompt_usage_stats table
    op.drop_table('prompt_usage_stats')
    
    # Remove columns from prompt_history
    op.drop_column('prompt_history', 'is_public')
    op.drop_column('prompt_history', 'last_used_at')
    op.drop_column('prompt_history', 'average_score')
    op.drop_column('prompt_history', 'usage_count')
    op.drop_column('prompt_history', 'template_variables')
    op.drop_column('prompt_history', 'is_template')
    op.drop_column('prompt_history', 'tags')
    op.drop_column('prompt_history', 'category')
    op.drop_column('prompt_history', 'description')
    op.drop_column('prompt_history', 'name')
