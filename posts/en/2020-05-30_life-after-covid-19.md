---
layout: post
title: "Life after COVID-19"
date: 2020-05-30 12:00
comments: true
status: scored
reviewed: 2026-10
status_note: >
  Scored in October 2026. I left the 2020 text alone and marked each guess in
  the margin, and the tally is at the end. More right than wrong, and the miss
  was being too hopeful about how long the world would keep its guard up.
categories:
  - opinion
  - COVID-19
---

COVID-19 is here to stay, even if we eradicate it,[^2026m-stays] its effects will linger in our world and minds for years.

[^2026m-stays]: held: It was never eradicated. It's endemic now, with yearly shots like the flu, and its effects did last for years.

I'm going to list some phrases we've heard over these months and give my opinions on them.

## "Flu kills more people, why panic?"

I think it is very evident now that COVID-19 is a very deadly disease, just look at the alarming news in 2018 about 80k deaths from flu in the USA during winter and compare it to what COVID-19 did during spring,[^flu-deaths][^2026-excess] but I think the most important part of it, and why a lot of people in government and upper class panicked is that it can kill anyone.

[^flu-deaths]: CNN: https://www.cnn.com/2018/09/26/health/flu-deaths-2017--2018-cdc-bn/index.html

[^2026-excess]: The final numbers were far worse than I could see in May 2020. The WHO estimated about 14.9 million excess deaths worldwide in 2020 and 2021 alone.

:::pullquote
Rich people can survive a lot of things that take a lot of lives every day worldwide, but this is a new disease and they cannot pay for immunity (yet).
:::

## "The government of X country is doing very bad"

Last flu epidemic in 2009 had a faster response from the USA and the world because it started very close, in Mexico.[^cruise] I think the world assumed that it was China's problem and that distance was protecting everyone.

[^cruise]: Even the cruise companies acted faster in 2009. [Web Archive](https://web.archive.org/web/20090630144402/http://www.sdbj.com/industry_article.asp?aID=47999878.5516779.1777724.4325329.569692.256&aID2=136739)

:::pullquote
Any response from governments was more like an experiment and some might have worked better but replace X with any name and the phrase in the title will be true for almost 95% of countries.
:::

This crisis is something that no one could be prepared for[^2026-prepared] (because it requires a lot of money and planning) but it is very important to figure out what the best plan is for a new contagious disease in the future.

[^2026-prepared]: I'd soften this now. Taiwan and South Korea had plans from SARS and MERS and did much better early on, and my own 2009 example right above points the same way.

More diseases will come and we have to be prepared.[^2026m-morediseases]

[^2026m-morediseases]: held: Mpox was declared a global emergency in 2022 and again in 2024, and H5N1 bird flu reached US dairy cows in 2024.

## "We have flattened the curve!"

As you can see in the following picture, the trend is similar in all countries, some have been able to slow it down and in others deaths are still on the rise. Stay at home orders haven't had the same success in all countries due to socio-economic differences but we are in the same boat and we can't assume we can go back to normal because our country, state or county is doing better. We'll have to wait until the whole world's death rate is close to zero.[^2026m-deathrate]

[^2026m-deathrate]: missed: Most countries dropped their restrictions in 2021 and 2022, long before vaccines reached everyone. The WHO ended the emergency in May 2023 with people still dying.

The whole world doesn't have to stop until this is solved, but we'll have to still keep certain measures for a while until a vaccine is available for everyone.

:::figure main #fig-deaths
```chart
type: line
data: 2020-05-30/covid-deaths.csv
x: day
y: deaths
scale: log
xUnit: day
series: country
focus: [Brazil, India, Chile, Colombia]
highlight: Mexico
# China's 17 Apr 2020 revision added 1,290 earlier deaths in one day (a 7-day box at day 83-89).
# "China" leaves them out; the dotted line is the data as reported (scripts/covid-data.ts).
dotted: [China (as reported)]
dottedLabel: China, as reported
yTicks: [10, 100, 1000]
xTickStep: 20
yTitle: deaths per day · 7-day average · log scale
xTitle: days since 5 daily deaths first reported
note: past their peak: US, UK, France, Italy, Spain …
alt: Daily COVID-19 deaths by country on a log scale: Brazil, Mexico, India, Chile and Colombia were still rising at day 50–66, while the US, UK, France, Italy, Spain and most of Europe had passed their peaks.
```

Daily confirmed COVID-19 deaths, aligned by the day each country first reported five. Mexico, Brazil, India, Chile and Colombia seem to be in the same situation, deaths on the rise without a clear peak.

Source: European CDC via Our World in Data, data to 30 May 2020, CC BY. On 17 April 2020 China added 1,290 earlier Wuhan deaths to a single day. The dotted line shows the data as reported, and China's solid line leaves those deaths out.
:::

## "The economy is collapsing, we have to go back to normal"

Anyone is at risk of contracting the virus, and some will tell you that there is no "normal" anymore.

I translate that as: trust is no longer a given. When you shake hands, buy a meal, board a plane or train, share a car, etc, do you trust the other people to not have a contagious disease? It sounds paranoid, but when your life is at stake, there's no such thing as taking too many precautions.

:::pullquote
Over time, if we get a cure, we'll not think as much about it but once a new disease comes, trust will be the first global casualty.[^2026m-trust]
:::

[^2026m-trust]: held: Pew found the share of Americans with a great deal of confidence in scientists fell from 39% in late 2020 to 23% in 2023.

The economy will also suffer from trust issues because people will start thinking twice before acquiring anything,[^2026m-thinktwice] be it because of fear or because they may need that money for healthcare.

[^2026m-thinktwice]: partly: True for a few months, when US savings jumped in 2020. Then people went back to spending, and inflation became the worry in 2021 and 2022.

## "But I need to work"

Staying at home is a privilege, some of us are lucky to be able to work from home but not everyone can and that is precisely why we have to press the government to provide solutions for everyone.

You need to work to get money, you need money for food, housing and utilities. Grocery stores, landlords and corporations need your money to keep existing, pay their employees, pay taxes, etc. The chain goes on until someone can provide assistance by forgoing the charges.

Economic collapse is not something that only you have to suffer, it is something that governments will have to plan for, and have procedures on how to help those in need in situations like this.

Sadly, as I stated earlier, no one was prepared for this and even sadder: people will die because of the lack of clear procedures in a crisis like this one.

Go to work, but take care. If you lost your job, things are going to be more difficult but don't put yourself or your family at risk, their lives and yours are more valuable than anything else.

## Wild guesses

- Summer is here but tourism will not be the same, a lot of people will not travel out of fear and a lot of countries will suffer from it, economically and socially.[^2026m-tourism]

- A better mask design is needed for people to wear for long periods, we will see new designs for both healthcare providers (who need maximum protection since they are for sure in contact with the virus) and normal people.[^2026m-masks]

- Some epidemic models[^models] show that without a cure and permanent social distancing, COVID-19 will come in waves or at least with a new wave after lifting restrictions. I fear that we'll get a bad mutation in a country where restrictions are not followed and we'll be back to panic.[^2026m-mutation]

  :::figure margin #fig-rt
  ```chart
  type: line
  data: 2020-05-30/ca-rt.csv
  x: date
  y: rt
  scale: linear
  xUnit: date
  # 11-13 Feb are model warm-up spikes (R_t 37, 13, 6), not estimates.
  xFrom: 2020-02-15
  yMin: 0
  yMax: 4
  yTicks: [1, 2, 3]
  band: [p10, p90]
  split: 2020-05-16
  markerAt: 2020-05-20
  markerLabel: reopening
  ref: 1
  refLabel: R = 1
  peak: true
  yTitle: R_t
  alt: Modelled reproduction number for California: near 1.1 through May, then a projected rebound to a peak of 2.4 after reopening in June under the return-to-normal scenario.
  ```
  California's modelled R<sub>t</sub> under the "return to normal" scenario, as projected on 16 May 2020. The band is the model's 10–90% range.

  Source: Modeling COVID, modelingcovid.com (run of 16 May 2020; the post's original screenshot came from a slightly later run).
  :::

[^2026m-tourism]: partly: True that summer and the next one. By 2024, UN Tourism counted international arrivals back at 99% of 2019.

[^2026m-masks]: partly: Better masks did spread (N95, KN95), but they were old designs that just got easier to buy. I didn't see a new design take over.

[^2026m-mutation]: held: Waves came after reopenings, and Delta (2021) and Omicron (late 2021) brought the panic back. Variants showed up wherever the virus spread a lot, not only where rules were ignored.

[^models]: Modeling COVID site <https://modelingcovid.com/state/CA>

- Rich people will value isolation more, companies that offer products used in isolation will be backed by VCs.[^2026m-vcs]

[^2026m-vcs]: held: Peloton, Zoom and the delivery apps boomed in 2020 and 2021, and Peloton then lost most of its value.

All these are just my opinions, but I think the greatest social distancing will not be the 6 feet away from other people but the divide between social classes with the poor dying more and the rich trying to get more isolated from risky contact with potential carriers.[^2026m-kshape]

[^2026m-kshape]: held: "K-shaped recovery" became the name for it. The World Bank estimated about 70 million people fell into extreme poverty in 2020, the biggest one-year jump since it started counting in 1990.

I know books like "Factfulness" present statistics on how things are better over time. But for me, that is just a symptom of globalization.[^2026-globalization]

[^2026-globalization]: Both things turned out to be true. Extreme poverty had been falling for decades, and then in 2020 it rose for the first time in a generation.

Countries' numbers are more alike first world countries now, but averages make it look like poor countries are less and less over time while the difference between the poor people and the rich is still big and a crisis like this one exacerbates that gap and makes it more apparent.

Life goes on, and it is short. I hope we get out of this problem in the foreseeable future and that we start fixing so many things that are wrong in our world.

---

:::scorecard

## Wild guesses, scored in 2026

| What I said in May 2020 | Verdict | What happened |
|---|---|---|
| COVID-19 is here to stay | held | Endemic, yearly shots |
| More diseases will come | held | Mpox emergencies 2022, 2024; H5N1 in cattle 2024 |
| Wait until the world's death rate is near zero | missed | Restrictions gone in 2021 and 2022; WHO emergency over May 2023 |
| Trust will be the first casualty | held | Pew: "a great deal" of trust in scientists 39% to 23% (2020 to 2023) |
| People will think twice before buying | partly | Brief savings spike, then a spending boom and inflation |
| Tourism will not be the same | partly | Down for two years, 99% of 2019 by 2024 |
| Better masks needed | partly | N95 and KN95 went mainstream, no new design |
| Waves and a bad mutation | held | Delta, Omicron |
| VCs will back isolation products | held | Peloton and Zoom boom, then bust |
| The poor will die more | held | K-shaped recovery, about 70M into extreme poverty in 2020 |

Sources: WHO excess mortality (May 2022), Pew Research (Nov 2023), UN Tourism (Jan 2025), World Bank Poverty and Shared Prosperity 2022.

:::
