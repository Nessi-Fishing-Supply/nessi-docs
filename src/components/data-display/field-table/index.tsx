import styles from './field-table.module.scss';

interface FieldTableColumn<T> {
  key: string;
  label: string;
  width?: string;
  render?: (value: unknown, field: T) => React.ReactNode;
}

interface FieldTableProps<T> {
  fields: T[];
  columns: FieldTableColumn<T>[];
  changedFields?: Set<string>;
  addedFields?: T[];
  nameKey?: keyof T & string;
}

export function FieldTable<T extends { name: string }>({
  fields,
  columns,
  changedFields,
  addedFields,
  nameKey = 'name' as keyof T & string,
}: FieldTableProps<T>) {
  function getField(field: T, key: string): unknown {
    return (field as Record<string, unknown>)[key];
  }

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
                    ? col.render(getField(field, col.key), field)
                    : ((getField(field, col.key) as React.ReactNode) ?? '—')}
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
                    ? col.render(getField(field, col.key), field)
                    : ((getField(field, col.key) as React.ReactNode) ?? '—')}
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
