'use client';

import type { Role } from '@/types/permission';
import { PERMISSION_FEATURES, LEVEL_CONFIG } from '@/types/permission';
import { useDocsContext } from '@/providers/docs-provider';
import styles from './permissions-matrix.module.scss';

interface PermissionsMatrixProps {
  roles: Role[];
}

export function PermissionsMatrix({ roles }: PermissionsMatrixProps) {
  const { setSelectedItem } = useDocsContext();

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h2 className={styles.title}>Permissions Matrix</h2>
        <p className={styles.subtitle}>
          {roles.length} roles &middot; {PERMISSION_FEATURES.length} features
        </p>
      </div>

      {/* Role Cards */}
      <div className={styles.roleCards}>
        {roles.map((role) => (
          <button
            key={role.slug}
            className={styles.roleCard}
            onClick={() => setSelectedItem({ type: 'role', role })}
          >
            <span className={styles.roleName} style={{ color: role.color }}>
              {role.name}
            </span>
            <p className={styles.roleDescription}>{role.description}</p>
          </button>
        ))}
      </div>

      {/* Matrix Table */}
      <div className={styles.matrix}>
        {/* Header Row */}
        <div className={styles.matrixHeader}>
          <div className={styles.featureCol}>Feature</div>
          {roles.map((role) => (
            <div key={role.slug} className={styles.roleCol} style={{ color: role.color }}>
              {role.name}
            </div>
          ))}
        </div>

        {/* Feature Rows */}
        {PERMISSION_FEATURES.map((feature, idx) => (
          <div key={feature.key} className={`${styles.matrixRow} ${idx % 2 === 0 ? styles.even : ''}`}>
            <div className={styles.featureInfo}>
              <span className={styles.featureLabel}>{feature.label}</span>
              <span className={styles.featureDescription}>{feature.description}</span>
            </div>
            {roles.map((role) => {
              const level = role.permissions[feature.key];
              const config = LEVEL_CONFIG[level];
              return (
                <div key={role.slug} className={styles.levelCell}>
                  <span
                    className={styles.levelBadge}
                    style={{ color: config.color, borderColor: config.color }}
                  >
                    {config.label}
                  </span>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Notes */}
      <div className={styles.notes}>
        <h2 className={styles.notesTitle}>Implementation Notes</h2>
        <ul className={styles.notesList}>
          <li>
            Permission checks are enforced server-side via <code className={styles.code}>assertShopPermission()</code> in
            each relevant API route and server action.
          </li>
          <li>
            The <code className={styles.code}>shop_members</code> table stores each member&apos;s role as an enum column.
            Role changes take effect immediately with no cache invalidation required.
          </li>
          <li>
            <code className={styles.code}>View</code> access means the user can read the data but all write operations
            return a <code className={styles.code}>403 Forbidden</code> response.
          </li>
          <li>
            The Owner role is unique per shop. Transferring ownership atomically reassigns the previous owner to Manager
            via <code className={styles.code}>transferShopOwnership()</code>.
          </li>
          <li>
            UI surfaces (nav items, action buttons) are conditionally rendered based on the current member&apos;s role
            using the <code className={styles.code}>useShopPermissions()</code> hook on the client.
          </li>
        </ul>
      </div>
    </div>
  );
}
