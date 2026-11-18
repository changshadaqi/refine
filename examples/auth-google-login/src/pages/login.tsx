import { useLogin } from "@refinedev/core";
import { useEffect, useRef } from "react";

import { ThemedTitle as ThemedTitleV2 } from "@refinedev/antd";
import { Layout, Space, Typography } from "antd";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export const Login: React.FC = () => {
  const { mutate: login } = useLogin<CredentialResponse>();

  const GoogleButton = (): React.JSX.Element => {
    const divRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (typeof window === "undefined" || !window.google || !divRef.current) {
        return;
      }

      try {
        window.google.accounts.id.initialize({
          ux_mode: "popup",
          client_id: GOOGLE_CLIENT_ID,
          callback: async (res: CredentialResponse) => {
            if (res.credential) {
              login(res);
            }
          },
        });
        window.google.accounts.id.renderButton(divRef.current, {
          theme: "filled_blue",
          size: "medium",
          type: "standard",
        });
      } catch (error) {
        console.log(error);
      }
    }, [GOOGLE_CLIENT_ID, window.google, divRef.current]);

    return <div ref={divRef} id="login-with-google-button" />;
  };

  return (
    <Layout
      style={{
        height: "100vh",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Space direction="vertical" align="center" size="large">
        <ThemedTitleV2
          collapsed={false}
          wrapperStyles={{
            fontSize: "22px",
          }}
        />
        <GoogleButton />
        <Typography.Text type="secondary">Powered by Google</Typography.Text>
      </Space>
    </Layout>
  );
};
