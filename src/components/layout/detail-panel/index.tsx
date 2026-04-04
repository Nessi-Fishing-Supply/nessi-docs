'use client';

import { useAppStore } from '@/libs/app-store';
import { StepPanel } from './panels/step-panel';
import { EntityPanel } from './panels/entity-panel';
import { LifecyclePanel } from './panels/lifecycle-panel';
import { FeaturePanel } from './panels/feature-panel';
import { PermissionPanel } from './panels/permission-panel';
import { ConfigPanel } from './panels/config-panel';
import { DiffPanel } from './panels/diff-panel';
import styles from './detail-panel.module.scss';

export function DetailPanel() {
  const selectedItem = useAppStore.use.selectedItem();

  if (!selectedItem) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyIcon}>&#x2B21;</div>
        <p className={styles.emptyText}>Select any item to see its details</p>
        <p className={styles.emptyHint}>Click a step, endpoint, entity, or state node</p>
      </div>
    );
  }

  return (
    <div className={styles.panel}>
      {selectedItem.type === 'step' && (
        <StepPanel node={selectedItem.node} journey={selectedItem.journey} />
      )}
      {selectedItem.type === 'entity' && <EntityPanel entity={selectedItem.entity} />}
      {selectedItem.type === 'lifecycle-state' && (
        <LifecyclePanel state={selectedItem.state} lifecycle={selectedItem.lifecycle} />
      )}
      {selectedItem.type === 'feature' && <FeaturePanel feature={selectedItem.feature} />}
      {selectedItem.type === 'role' && <PermissionPanel role={selectedItem.role} />}
      {selectedItem.type === 'config-enum' && <ConfigPanel configEnum={selectedItem.configEnum} />}
      {selectedItem.type === 'diff-item' && <DiffPanel item={selectedItem.item} />}
    </div>
  );
}
