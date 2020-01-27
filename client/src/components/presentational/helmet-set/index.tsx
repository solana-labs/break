import * as React from "react";

import "./index.scss";
import { Helmet } from "react-helmet";

//Create favicon in https://www.favicon-generator.org/

export const HelmetSet = () => {
  return (
    <React.Fragment>
      <Helmet
        link={[
          {
            rel: "apple-touch-icon",
            href: require("@images/favicon/apple-icon-57x57.png"),
            sizes: "57x57"
          },
          {
            rel: "apple-touch-icon",
            href: require("@images/favicon/apple-icon-60x60.png"),
            sizes: "60x60"
          },
          {
            rel: "apple-touch-icon",
            href: require("@images/favicon/apple-icon-72x72.png"),
            sizes: "72x72"
          },
          {
            rel: "apple-touch-icon",
            href: require("@images/favicon/apple-icon-76x76.png"),
            sizes: "76x76"
          },
          {
            rel: "apple-touch-icon",
            href: require("@images/favicon/apple-icon-114x114.png"),
            sizes: "114x114"
          },
          {
            rel: "apple-touch-icon",
            href: require("@images/favicon/apple-icon-120x120.png"),
            sizes: "120x120"
          },
          {
            rel: "apple-touch-icon",
            href: require("@images/favicon/apple-icon-144x144.png"),
            sizes: "144x144"
          },
          {
            rel: "apple-touch-icon",
            href: require("@images/favicon/apple-icon-152x152.png"),
            sizes: "152x152"
          },
          {
            rel: "apple-touch-icon",
            href: require("@images/favicon/apple-icon-180x180.png"),
            sizes: "180x180"
          },
          {
            rel: "icon",
            type: "image/png",
            href: require("@images/favicon/android-icon-192x192.png"),
            sizes: "192x192"
          },
          {
            rel: "icon",
            type: "image/png",
            href: require("@images/favicon/favicon-32x32.png"),
            sizes: "32x32"
          },
          {
            rel: "icon",
            type: "image/png",
            href: require("@images/favicon/favicon-96x96.png"),
            sizes: "96x96"
          },
          {
            rel: "icon",
            type: "image/png",
            href: require("@images/favicon/favicon-16x16.png"),
            sizes: "16x16"
          }
        ]}
        meta={[
          { name: "msapplication-TileColor", content: "#000000" },
          {
            name: "msapplication-TileImage",
            content: require("@images/favicon/ms-icon-144x144.png")
          },
          { name: "og:image", content: require("@images/SOLANA-preview.png") },
          { name: "og:image:width", content: "1200" },
          { name: "og:image:height", content: "600" }
        ]}
      />
    </React.Fragment>
  );
};
