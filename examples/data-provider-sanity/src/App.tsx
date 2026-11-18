import { GitHubBanner, Refine } from "@refinedev/core";
import {
  useNotificationProvider,
  ThemedLayout,
  ErrorComponent,
  RefineThemes,
} from "@refinedev/antd";
import { createClient } from "@sanity/client";
import dataProvider from "refine-sanity";
import routerProvider, {
  NavigateToResource,
  UnsavedChangesNotifier,
  DocumentTitleHandler,
} from "@refinedev/react-router";
import { BrowserRouter, Routes, Route, Outlet } from "react-router";
import { ConfigProvider, App as AntdApp } from "antd";
import "@ant-design/v5-patch-for-react-19";
import "@refinedev/antd/dist/reset.css";

import { PostList, PostCreate, PostEdit, PostShow } from "./pages/posts";
import { CategoryList, CategoryCreate, CategoryEdit } from "./pages/categories";
import { DevtoolsPanel, DevtoolsProvider } from "@refinedev/devtools";

const client = createClient({
  token: import.meta.env.VITE_SANITY_API_TOKEN,
  projectId: import.meta.env.VITE_SANITY_PROJECT_ID,
  dataset: "production",
  perspective: "published",
  useCdn: false,
  apiVersion: "2021-10-21",
});

const App: React.FC = () => {
  return (
    <DevtoolsProvider>
      <BrowserRouter>
        <GitHubBanner />
        <ConfigProvider theme={RefineThemes.Blue}>
          <AntdApp>
            <Refine
              routerProvider={routerProvider}
              dataProvider={dataProvider(client)}
              resources={[
                {
                  name: "post",
                  list: "/post",
                  show: "/post/show/:id",
                  create: "/post/create",
                  edit: "/post/edit/:id",
                  meta: {
                    canDelete: true,
                  },
                },
                {
                  name: "category",
                  list: "/category",
                  create: "/category/create",
                  edit: "/category/edit/:id",
                  meta: {
                    canDelete: true,
                  },
                },
              ]}
              notificationProvider={useNotificationProvider}
              options={{
                liveMode: "auto",
                syncWithLocation: true,
                warnWhenUnsavedChanges: true,
              }}
            >
              <Routes>
                <Route
                  element={
                    <ThemedLayout>
                      <Outlet />
                    </ThemedLayout>
                  }
                >
                  <Route index element={<NavigateToResource />} />

                  <Route path="/post">
                    <Route index element={<PostList />} />
                    <Route path="create" element={<PostCreate />} />
                    <Route path="edit/:id" element={<PostEdit />} />
                    <Route path="show/:id" element={<PostShow />} />
                  </Route>

                  <Route path="/category">
                    <Route index element={<CategoryList />} />
                    <Route path="create" element={<CategoryCreate />} />
                    <Route path="edit/:id" element={<CategoryEdit />} />
                  </Route>

                  <Route path="*" element={<ErrorComponent />} />
                </Route>
              </Routes>
              <UnsavedChangesNotifier />
              <DocumentTitleHandler />
            </Refine>
          </AntdApp>
        </ConfigProvider>
        <DevtoolsPanel />
      </BrowserRouter>
    </DevtoolsProvider>
  );
};

export default App;
