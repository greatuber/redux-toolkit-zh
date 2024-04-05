import React from "react";
import Layout from "@theme/Layout";
import { useLocation } from "@docusaurus/router";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import styles from "./styles.module.css";
import errorCodes from "../../errors.json";

function Errors() {
  const location = useLocation();
  const context = useDocusaurusContext();
  const { siteConfig } = context;
  const errorCode = new URLSearchParams(location.search).get("code");
  const error = errorCodes[errorCode];

  return (
    <Layout
      title={`${siteConfig.title} - ${siteConfig.tagline}`}
      description={siteConfig.tagline}
    >
      <main className={styles.mainFull}>
        <h1>生产错误代码</h1>
        <p>
          当Redux
          Toolkit构建并在生产中运行时，错误文本被替换为索引错误代码以节省包大小。这些错误
          将提供一个链接到此页面，下面有关于错误的更多信息。
        </p>
        {error && (
          <React.Fragment>
            <p>
              <strong>您刚刚遇到的错误的完整文本是：</strong>
            </p>
            <code className={styles.errorDetails}>{error}</code>
          </React.Fragment>
        )}

        <h2>所有错误代码</h2>
        <table>
          <thead>
            <tr>
              <th style={{ whiteSpace: "nowrap" }}>代码</th>
              <th>消息</th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(errorCodes).map((code) => (
              <tr>
                <td>{code}</td>
                <td>{errorCodes[code]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>
    </Layout>
  );
}

export default Errors;
