# Blog

This blog is built with Next.js static generation from markdown files.

Some custom components were created but it is very easy to author new posts
as all you need is to create a file in the `posts` directory.

## Posts

Posts are written inside subdirectories for each supported language.

```
posts
├── en
│   └── 2020-05-15_time-flies-when-you-are-having-fun.md
└── es
    └── 2020-05-15_time-flies-when-you-are-having-fun.md
```

The post file name is important, it has to follow this pattern:

`YEAR-MONTH-DAY_your-post-name`

it will be published at the path: `LANG/YEAR/MONTH/your-post-name`

# Used technologies and libraries

- _next.js_ - Static generation of the blog
- _markdown format_ - for the posts
- _jdown_ - To convert markdown files into
- _tufte css_ - Styles for book-like look
