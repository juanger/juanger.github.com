import Layout from "../components/Layout";
import Head from "next/head";

import Github from "@fortawesome/fontawesome-free/svgs/brands/github-square.svg";
import Linkedin from "@fortawesome/fontawesome-free/svgs/brands/linkedin.svg";
import Flickr from "@fortawesome/fontawesome-free/svgs/brands/flickr.svg";
import Twitter from "@fortawesome/fontawesome-free/svgs/brands/twitter-square.svg";
import PageHeader from "../components/PageHeader";

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
      <PageHeader lang="es" translationUrl={false}></PageHeader>

      <article>
        <h1>Acerca de mi</h1>

        <section>
          <a href="https://github.com/juanger">
            <Github fill="#111"></Github>
            <p>Programación</p>
          </a>
          <a href="https://www.linkedin.com/in/juanger/">
            <Linkedin fill="#0077b5"></Linkedin>
            <p>Curriculum</p>
          </a>
          <a href="https://www.flickr.com/photos/juanger/">
            <Flickr fill="#111"></Flickr>
            <p>Fotografía</p>
          </a>
          <a href="https://twitter.com/juanger_">
            <Twitter fill="rgb(29, 161, 242)"></Twitter>
            <p>Desahogos fugaces</p>
          </a>
        </section>

        <section>
          <p>
            Mi nombre es Juan Germán Castañeda Echevarría, me gusta programar
            computadoras, andar en bicicleta, tocar música (aunque no sea muy
            bueno), jugar fútbol, la naturaleza y disfrutar de la vida lo más
            posible.
          </p>

          <p>
            Mi blog se llama Ruby Xocolatl porque al inicio mis escritos
            trataban sobre conjuntar el lenguaje de programación Ruby, con
            aplicaciones de Mac OS X. Apple llamó "Cocoa" a sus bibliotecas de
            desarrollo de applicaciones para Mac OS X y yo, siendo mexicano,
            quize usar el nombre que los aztecas le daban al chocolate,
            xocolatl, en vez de cocoa, el nombre que de los granos con que se
            hace el chocolate.
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
