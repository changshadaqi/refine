import type { CrudFilters, HttpError } from "@refinedev/core";
import {
  DateField,
  DeleteButton,
  EditButton,
  List,
  ShowButton,
  TextField,
  getDefaultSortOrder,
  useTable,
} from "@refinedev/antd";

import { Button, Form, Input, Select, Space, Table, Tag } from "antd";

import type { IPost, PostStatus } from "../../interfaces";

type SearchValues = {
  title?: string;
  status?: PostStatus;
};

const statusColors: Record<PostStatus, string> = {
  published: "green",
  draft: "gold",
  rejected: "red",
};

const statusOptions = [
  { label: "Published", value: "published" },
  { label: "Draft", value: "draft" },
  { label: "Rejected", value: "rejected" },
];

export const PostList = () => {
  const { tableProps, searchFormProps, sorters } = useTable<
    IPost,
    HttpError,
    SearchValues
  >({
    sorters: {
      initial: [{ field: "created_at", order: "desc" }],
    },
    onSearch: (values) => {
      const filters: CrudFilters = [];

      if (values.title) {
        filters.push({
          field: "title",
          operator: "contains",
          value: values.title,
        });
      }

      if (values.status) {
        filters.push({
          field: "status",
          operator: "eq",
          value: values.status,
        });
      }

      return filters;
    },
  });

  return (
    <List>
      <Form {...searchFormProps} layout="inline" style={{ marginBottom: 16 }}>
        <Form.Item label="Title" name="title">
          <Input placeholder="Search by title" allowClear />
        </Form.Item>
        <Form.Item label="Status" name="status">
          <Select
            allowClear
            placeholder="Any status"
            style={{ width: 160 }}
            options={statusOptions}
          />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit">
              Search
            </Button>
            <Button
              htmlType="reset"
              onClick={() => searchFormProps.onFinish?.({})}
            >
              Reset
            </Button>
          </Space>
        </Form.Item>
      </Form>

      <Table {...tableProps} rowKey="id">
        <Table.Column dataIndex="id" title="ID" />
        <Table.Column
          dataIndex="title"
          title="Title"
          sorter
          defaultSortOrder={getDefaultSortOrder("title", sorters)}
          render={(value: string) => <TextField value={value} />}
        />
        <Table.Column
          dataIndex={["category", "title"]}
          title="Category"
          render={(value: string) => <TextField value={value} />}
        />
        <Table.Column<IPost>
          dataIndex="status"
          title="Status"
          render={(value: PostStatus) => (
            <Tag color={statusColors[value]}>{value}</Tag>
          )}
        />
        <Table.Column
          dataIndex="created_at"
          title="Created At"
          sorter
          defaultSortOrder={getDefaultSortOrder("created_at", sorters)}
          render={(value: string) => <DateField value={value} format="LLL" />}
        />
        <Table.Column<IPost>
          title="Actions"
          dataIndex="actions"
          render={(_, record) => (
            <Space>
              <EditButton hideText size="small" recordItemId={record.id} />
              <ShowButton hideText size="small" recordItemId={record.id} />
              <DeleteButton hideText size="small" recordItemId={record.id} />
            </Space>
          )}
        />
      </Table>
    </List>
  );
};
