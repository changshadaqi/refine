import { Authenticated, GitHubBanner, Refine } from "@refinedev/core";
import {
  AuthPage,
  ErrorComponent,
  RefineThemes,
  ThemedLayout,
  useNotificationProvider,
} from "@refinedev/antd";
import routerProvider, {
  CatchAllNavigate,
  DocumentTitleHandler,
  NavigateToResource,
  UnsavedChangesNotifier,
} from "@refinedev/react-router";
import { FileTextOutlined, TagsOutlined } from "@ant-design/icons";
import { App as AntdApp, ConfigProvider } from "antd";
import { BrowserRouter, Outlet, Route, Routes } from "react-router";

import "@ant-design/v5-patch-for-react-19";
import "@refinedev/antd/dist/reset.css";

import { authProvider } from "./providers/auth-provider";
import { API_URL } from "./providers/constants";
import { createDataProvider } from "./providers/data-provider";

import { PostCreate, PostEdit, PostList, PostShow } from "./pages/posts";
import { CategoryCreate, CategoryEdit, CategoryList } from "./pages/categories";

const dataProvider = createDataProvider(API_URL);

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <GitHubBanner />
      <ConfigProvider theme={RefineThemes.Blue}>
        <AntdApp>
          <Refine
            authProvider={authProvider}
            dataProvider={dataProvider}
            routerProvider={routerProvider}
            resources={[
              {
                name: "posts",
                list: "/posts",
                create: "/posts/create",
                edit: "/posts/edit/:id",
                show: "/posts/show/:id",
                meta: {
                  label: "Posts",
                  icon: <FileTextOutlined />,
                },
              },
              {
                name: "categories",
                list: "/categories",
                create: "/categories/create",
                edit: "/categories/edit/:id",
                meta: {
                  label: "Categories",
                  icon: <TagsOutlined />,
                },
              },
            ]}
            notificationProvider={useNotificationProvider}
            options={{
              syncWithLocation: true,
              warnWhenUnsavedChanges: true,
            }}
          >
            <Routes>
              <Route
                element={
                  <Authenticated
                    key="authenticated-routes"
                    fallback={<CatchAllNavigate to="/login" />}
                  >
                    <ThemedLayout>
                      <Outlet />
                    </ThemedLayout>
                  </Authenticated>
                }
              >
                <Route
                  index
                  element={<NavigateToResource resource="posts" />}
                />

                <Route path="/posts">
                  <Route index element={<PostList />} />
                  <Route path="create" element={<PostCreate />} />
                  <Route path="edit/:id" element={<PostEdit />} />
                  <Route path="show/:id" element={<PostShow />} />
                </Route>

                <Route path="/categories">
                  <Route index element={<CategoryList />} />
                  <Route path="create" element={<CategoryCreate />} />
                  <Route path="edit/:id" element={<CategoryEdit />} />
                </Route>

                <Route path="*" element={<ErrorComponent />} />
              </Route>

              <Route
                element={
                  <Authenticated key="auth-pages" fallback={<Outlet />}>
                    <NavigateToResource resource="posts" />
                  </Authenticated>
                }
              >
                <Route
                  path="/login"
                  element={
                    <AuthPage
                      type="login"
                      title="登录管理后台"
                      forgotPasswordLink={false}
                      formProps={{
                        initialValues: {
                          email: import.meta.env.VITE_DEMO_EMAIL,
                          password: import.meta.env.VITE_DEMO_PASSWORD,
                        },
                      }}
                    />
                  }
                />
                <Route
                  path="/register"
                  element={<AuthPage type="register" title="注册管理后台" />}
                />
              </Route>
            </Routes>
            <UnsavedChangesNotifier />
            <DocumentTitleHandler />
          </Refine>
        </AntdApp>
      </ConfigProvider>
    </BrowserRouter>
  );
};

export default App;
