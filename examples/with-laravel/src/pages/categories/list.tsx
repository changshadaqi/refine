import {
  DateField,
  DeleteButton,
  EditButton,
  List,
  getDefaultSortOrder,
  useTable,
} from "@refinedev/antd";

import { Space, Table } from "antd";

import type { ICategory } from "../../interfaces";

export const CategoryList = () => {
  const { tableProps, sorters } = useTable<ICategory>({
    sorters: {
      initial: [{ field: "created_at", order: "desc" }],
    },
  });

  return (
    <List>
      <Table {...tableProps} rowKey="id">
        <Table.Column dataIndex="id" title="ID" />
        <Table.Column
          dataIndex="title"
          title="Title"
          sorter
          defaultSortOrder={getDefaultSortOrder("title", sorters)}
        />
        <Table.Column
          dataIndex="created_at"
          title="Created At"
          sorter
          defaultSortOrder={getDefaultSortOrder("created_at", sorters)}
          render={(value: string) => <DateField value={value} format="LLL" />}
        />
        <Table.Column<ICategory>
          title="Actions"
          dataIndex="actions"
          render={(_, record) => (
            <Space>
              <EditButton hideText size="small" recordItemId={record.id} />
              <DeleteButton hideText size="small" recordItemId={record.id} />
            </Space>
          )}
        />
      </Table>
    </List>
  );
};
