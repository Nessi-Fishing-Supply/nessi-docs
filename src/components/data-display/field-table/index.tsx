import styles from './field-table.module.scss';

interface FieldTableColumn<T> {
  key: string;
  label: string;
  width?: string;
  render?: (value: unknown, field: T) => React.ReactNode;
}

interface FieldTableProps<T extends Record<string, unknown>> {
  fields: T[];
  columns: FieldTableColumn<T>[];
  changedFields?: Set<string>;
  addedFields?: T[];
  nameKey?: string;
}

export function FieldTable<T extends Record<string, unknown>>({
  fields,
  columns,
  changedFields,
  addedFields,
  nameKey = 'name',
}: FieldTableProps<T>) {
  return (
    <table className={styles.table}>
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={col.key} style={col.width ? { width: col.width } : undefined}>
              {col.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {fields.map((field) => {
          const name = field[nameKey] as string;
          const isChanged = changedFields?.has(name);
          return (
            <tr key={name} className={isChanged ? styles.fieldChanged : ''}>
              {columns.map((col) => (
                <td key={col.key}>
                  {col.render
                    ? col.render(field[col.key], field)
                    : ((field[col.key] as React.ReactNode) ?? '—')}
                </td>
              ))}
            </tr>
          );
        })}
        {addedFields?.map((field) => {
          const name = field[nameKey] as string;
          return (
            <tr key={`added-${name}`} className={styles.fieldAdded}>
              {columns.map((col) => (
                <td key={col.key}>
                  {col.render
                    ? col.render(field[col.key], field)
                    : ((field[col.key] as React.ReactNode) ?? '—')}
                </td>
              ))}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export type { FieldTableColumn };
