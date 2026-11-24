---
layout: post
title: "FreeBSD startup script with ruby"
date: 2008-05-26
comments: false
status: obsolete
reviewed: "2026-10"
status_note: >
  Mongrel has been dead for more than a decade, and this script skips FreeBSD's
  own rc.subr framework. The PATH lesson below still holds. Everything else I'd
  do differently today.
categories:
  - ruby
  - FreeBSD
  - code
---

Since some days ago I've been using FreeBSD in a Rails deployment server configuring it to use Capistrano, nginx and mongrel[^2026-mongrel] but then I wanted my mongrel instances to be run at startup and what I found was this message:

[^2026-mongrel]: Mongrel stopped being maintained around 2010. Puma has been the default Rails server since Rails 5, and nginx and Capistrano are both still around.

> Put your .sh script at /usr/local/etc/rc.d[^2026-rcd]

[^2026-rcd]: The proper way is a small sh script that loads rc.subr, so `service myapp start` and `sysrc myapp_enable=YES` work like for any other service. My Ruby script went around all of that.

And since I like ruby, I began to code my script with it and the problems came:

> env: ruby: No such file or directory

> custom_require.rb:27: command not found: mongrel_rails

First, here is my final code that was inspired by <a href="https://web.archive.org/web/20080602152255/http://snippets.dzone.com:80/posts/show/2594" title="Original: http://snippets.dzone.com/posts/show/2594">Tim Morgan's</a><span class="archived">archived</span>:

```ruby
#!/usr/local/bin/ruby

puts ENV["PATH"] += ":/usr/local/bin"
app_dir = '/usr/local/www'

apps = [
  scielo_index = { :name => "ScieloIndex",
                   :path => 'index.scielo.unam.mx/current',
                   :config => "config/mongrel_cluster.yml",
                   :cluster => true },

  redmine = { :name => "Redmine",
              :path => 'dev.scielo.unam.mx/Redmine',
              :config => "config/mongrel_8000.yml",
              :pid => "log/mongrel.pid" }
  ]

if ['stop', 'restart'].include? ARGV.first
  apps.each do |app|
    path = File.join app_dir, app[:path]
    puts "Stopping #{app[:name]}..."
    if app[:cluster]
      `mongrel_rails cluster::stop -C #{path}/#{app[:config]}`
    else
      `mongrel_rails stop -c #{path} -P #{app[:pid]}`
    end
  end
end

if ['start', 'restart'].include? ARGV.first
  apps.each do |app|
    path = File.join app_dir, app[:path]
    puts "Starting #{app[:name]}..."
    if app[:cluster]
      `mongrel_rails cluster::start -C #{path}/#{app[:config]}`
    else
      `mongrel_rails start -C #{path}/#{app[:config]}`
    end
  end
end

unless ['start', 'stop', 'restart'].include? ARGV.first
    puts "Usage: mongrel {start|stop|restart}"
    exit
end
```

The key part is the `ENV["PATH"]` setup,[^2026m-path] that line is needed as FreeBSD's PATH at startup is `"/sbin:/bin:/usr/sbin:/usr/bin"` and this also leads us to change the interpreter path from something like `"#!/usr/bin/env ruby"` to `"#!/usr/local/bin/ruby"`, i.e. its full path.

[^2026m-path]: This part is still true. rc scripts start with a minimal PATH, so use full paths or set PATH yourself.

That's all, now our ruby script really runs at startup time without complaining.

:::today

An untested sketch, check it on FreeBSD 14 first. The real way is a small rc.subr script, so `service myapp start` and `sysrc myapp_enable=YES` just work:

```sh
#!/bin/sh
#
# PROVIDE: myapp
# REQUIRE: LOGIN
# KEYWORD: shutdown

. /etc/rc.subr

name=myapp
rcvar=myapp_enable
load_rc_config $name
: ${myapp_enable:=NO}

pidfile=/var/run/${name}.pid
command=/usr/sbin/daemon
command_args="-f -P ${pidfile} -u www /bin/sh -c 'cd /usr/local/www/myapp && exec bundle exec puma -e production'"

run_rc_command "$1"
```

:::
