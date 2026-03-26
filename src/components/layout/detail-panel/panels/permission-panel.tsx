import type { Role } from '@/types/permission';
import { PERMISSION_FEATURES, LEVEL_CONFIG } from '@/types/permission';

export function PermissionPanel({ role }: { role: Role }) {
  return (
    <div style={{ padding: '16px' }}>
      <h3 style={{ fontSize: '14px', color: role.color, margin: '0 0 4px' }}>{role.name}</h3>
      <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.5, margin: '0 0 12px' }}>
        {role.description}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {PERMISSION_FEATURES.map((f) => {
          const level = role.permissions[f.key];
          const cfg = LEVEL_CONFIG[level];
          return (
            <div key={f.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{f.label}</span>
              <span style={{ fontSize: '9px', fontFamily: 'var(--font-family-mono)', color: cfg.color, fontWeight: 600 }}>
                {cfg.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
