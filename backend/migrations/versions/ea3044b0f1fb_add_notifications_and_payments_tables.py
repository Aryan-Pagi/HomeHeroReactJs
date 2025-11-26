"""add_notifications_and_payments_tables

Revision ID: ea3044b0f1fb
Revises: 5e008abcb0a8
Create Date: 2025-11-26 21:58:24.476056

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'ea3044b0f1fb'
down_revision = '5e008abcb0a8'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Check if tables exist before creating
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    existing_tables = inspector.get_table_names()
    
    # Create notifications table only if it doesn't exist
    if 'notifications' not in existing_tables:
        op.create_table(
            'notifications',
            sa.Column('notification_id', postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column('type', sa.String(length=50), nullable=False),
            sa.Column('message', sa.Text(), nullable=False),
            sa.Column('is_read', sa.Boolean(), server_default='false', nullable=False),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
            sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
            sa.PrimaryKeyConstraint('notification_id')
        )
        op.create_index(op.f('ix_notifications_user_id'), 'notifications', ['user_id'], unique=False)
        op.create_index(op.f('ix_notifications_is_read'), 'notifications', ['is_read'], unique=False)

    # Create payments table only if it doesn't exist
    if 'payments' not in existing_tables:
        op.create_table(
            'payments',
            sa.Column('payment_id', postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column('booking_id', postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column('amount', sa.Float(), nullable=False),
            sa.Column('payment_method', sa.Enum('RAZORPAY', 'STRIPE', 'CASH', name='paymentmethod'), nullable=False),
            sa.Column('status', sa.Enum('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED', name='paymentstatus'), server_default='PENDING', nullable=False),
            sa.Column('transaction_id', sa.String(), nullable=True),
            sa.Column('order_id', sa.String(), nullable=True),
            sa.Column('payment_signature', sa.String(), nullable=True),
            sa.Column('currency', sa.String(), server_default='INR', nullable=True),
            sa.Column('payment_date', sa.DateTime(timezone=True), nullable=True),
            sa.Column('failure_reason', sa.String(), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
            sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
            sa.ForeignKeyConstraint(['booking_id'], ['bookings.booking_id'], ),
            sa.PrimaryKeyConstraint('payment_id')
        )
        op.create_index(op.f('ix_payments_booking_id'), 'payments', ['booking_id'], unique=False)
        op.create_index(op.f('ix_payments_status'), 'payments', ['status'], unique=False)


def downgrade() -> None:
    # Drop payments table
    op.drop_index(op.f('ix_payments_status'), table_name='payments')
    op.drop_index(op.f('ix_payments_booking_id'), table_name='payments')
    op.drop_table('payments')
    op.execute('DROP TYPE IF EXISTS paymentmethod')
    op.execute('DROP TYPE IF EXISTS paymentstatus')

    # Drop notifications table
    op.drop_index(op.f('ix_notifications_is_read'), table_name='notifications')
    op.drop_index(op.f('ix_notifications_user_id'), table_name='notifications')
    op.drop_table('notifications')