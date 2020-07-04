import Layout from "../components/Layout";
import PageHeader from "../components/PageHeader";
import Head from "next/head";

import Github from "@fortawesome/fontawesome-free/svgs/brands/github-square.svg";
import Linkedin from "@fortawesome/fontawesome-free/svgs/brands/linkedin.svg";
import Flickr from "@fortawesome/fontawesome-free/svgs/brands/flickr.svg";
import Twitter from "@fortawesome/fontawesome-free/svgs/brands/twitter-square.svg";

export default function () {
  return (
    <Layout>
      <Head>
        <meta property="og:title" content="About Ruby Xocolatl" />
        <meta property="og:type" content="profile" />
        <meta
          property="og:image"
          content="https://blog.juanger.com/images/blog-og-image.png"
        />
      </Head>
      <PageHeader lang="en" translationUrl={false}></PageHeader>

      <article>
        <h1>About me</h1>

        <section>
          <a href="https://github.com/juanger">
            <Github fill="#111"></Github>
            <p>Programming</p>
          </a>
          <a href="https://www.linkedin.com/in/juanger/">
            <Linkedin fill="#0077b5"></Linkedin>
            <p>Resume</p>
          </a>
          <a href="https://www.flickr.com/photos/juanger/">
            <Flickr fill="#111"></Flickr>
            <p>Photography</p>
          </a>
          <a href="https://twitter.com/juanger_">
            <Twitter fill="rgb(29, 161, 242)"></Twitter>
            <p>Brief venting</p>
          </a>
        </section>

        <section>
          <p>
            My name is Juan Germán Castañeda Echevarría, I love programming,
            cycling, playing music (although I'm not very good), play futbol
            (soccer), nature and enjoying life as much as possible.
          </p>

          <p>
            My blog's name is Ruby Xocolatl because at the begining I wrote
            about using Ruby to create Mac OS X applications. Cocoa is the name
            apple chose for their application development libraries and being
            mexican, I chose to use the aztec name for chocolate, xocolatl,
            instead of cocoa, the name of the beans used to manufacture
            chocolate.
          </p>

          <p></p>
        </section>
      </article>
      <style>
        {`
          section a {
            display: grid;
            grid-template-columns: 50px auto;
            column-gap: 20px;
            background: none;
          }

          section a:link {
            background: none;
          }

          section p {
            align-self: center;
          }
        `}
      </style>
    </Layout>
  );
}
