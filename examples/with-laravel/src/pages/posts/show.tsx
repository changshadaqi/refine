import { useShow } from "@refinedev/core";
import { DateField, MarkdownField, Show } from "@refinedev/antd";

import { Tag, Typography } from "antd";

import type { IPost, PostStatus } from "../../interfaces";

const { Title, Text } = Typography;

const statusColors: Record<PostStatus, string> = {
  published: "green",
  draft: "gold",
  rejected: "red",
};

export const PostShow = () => {
  const { query } = useShow<IPost>();
  const { data, isLoading } = query;
  const record = data?.data;

  return (
    <Show isLoading={isLoading}>
      <Title level={5}>ID</Title>
      <Text>{record?.id}</Text>

      <Title level={5}>Title</Title>
      <Text>{record?.title}</Text>

      <Title level={5}>Category</Title>
      <Text>{record?.category?.title}</Text>

      <Title level={5}>Status</Title>
      {record?.status ? (
        <Tag color={statusColors[record.status]}>{record.status}</Tag>
      ) : null}

      <Title level={5}>Content</Title>
      <MarkdownField value={record?.content} />

      <Title level={5}>Created At</Title>
      <DateField value={record?.created_at} format="LLL" />
    </Show>
  );
};
