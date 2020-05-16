export default function ({ lang }) {
  return (
    <>
      <header>
        <a href={tocPath(lang)}>☰ {lang === "es" ? "Indice" : "Index"}</a>
      </header>
      <style jsx>{`
        header {
          text-align: right;
        }

        header a {
          background: none;
          color: #aaa;
          font-size: 1.2em;
          margin-right: 15px;
        }
      `}</style>
    </>
  );
}

function tocPath(lang) {
  if (lang === "es") {
    return "/es";
  } else {
    return "/";
  }
}
