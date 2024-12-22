"""initial

Revision ID: 159870efd385
Revises: 
Create Date: 2024-12-22 00:13:02.978599

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '159870efd385'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('vehicle', schema=None) as batch_op:
        batch_op.drop_column('daily_rate')

    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('vehicle', schema=None) as batch_op:
        batch_op.add_column(sa.Column('daily_rate', sa.FLOAT(), nullable=False))

    # ### end Alembic commands ###
