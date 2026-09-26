CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_name VARCHAR(100) NOT NULL,
    entity_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
    old_data JSONB,
    new_data JSONB,
    performed_by UUID,
    performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    correlation_id UUID NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_log(entity_name, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_performed_by ON audit_log(performed_by);
CREATE INDEX IF NOT EXISTS idx_audit_log_correlation ON audit_log(correlation_id);
