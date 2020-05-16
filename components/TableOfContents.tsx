export default function TableOfContents({ posts, children }) {
  return (
    <section id="TOC">
      {children}
      {Object.entries(postsByYear(posts))
        .sort(([yearA], [yearB]) => {
          return Number(yearB) - Number(yearA);
        })
        .map(([year, posts]) => {
          return (
            <React.Fragment key={year}>
              <h2>{year}</h2>
              <ol>
                {posts
                  .sort(({ month: a, day: dayA }, { month: b, day: dayB }) => {
                    var monthDiff = Number(b) - Number(a);
                    if (monthDiff !== 0) {
                      return monthDiff;
                    } else {
                      return Number(dayB) - Number(dayA);
                    }
                  })
                  .map((post) => {
                    const date = new Date(post.year, post.month - 1, post.day);
                    const month = date.toLocaleString("default", {
                      month: "short",
                    });

                    return (
                      <li key={post.slug}>
                        <time>
                          <span>{month}</span>
                          <span>{post.day}</span>
                        </time>
                        <a href={post.path}>{post.title}</a>
                      </li>
                    );
                  })}
              </ol>
            </React.Fragment>
          );
        })}
    </section>
  );
}

function postsByYear(posts) {
  const byYear = {};
  posts.forEach((post) => {
    byYear[post.year] = byYear[post.year] || [];
    byYear[post.year].push(post);
  });
  return byYear;
}
