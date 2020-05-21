export default function ({ lang, translationUrl }) {
  return (
    <>
      <header>
        <a href={tocPath(lang)}>☰ {lang === "es" ? "Indice" : "Index"}</a>
        {translationUrl ? (
          <a href={translationUrl}>
            {lang === "es" ? "🇺🇸 English" : "🇲🇽 Español"}
          </a>
        ) : (
          false
        )}
      </header>
      <style jsx>{`
        header {
          position: absolute;
          z-index: 100;
        }

        header a {
          font-size: 1.2em;
          margin-right: 15px;
        }

        header a:hover {
          color: #111;
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
