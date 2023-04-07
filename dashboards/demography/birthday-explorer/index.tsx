import { FunctionComponent, useMemo } from "react";
import {
  Container,
  Hero,
  Section,
  StateDropdown,
  Button,
  Dropdown,
  Input,
} from "@components/index";
import dynamic from "next/dynamic";
import { AKSARA_COLOR, BREAKPOINTS, CountryAndStates } from "@lib/constants";
import { useData } from "@hooks/useData";
import { useTranslation } from "@hooks/useTranslation";
import { useWindowWidth } from "@hooks/useWindowWidth";
import AgencyBadge from "@components/AgencyBadge";
import { CakeIcon, MagnifyingGlassIcon as SearchIcon } from "@heroicons/react/24/solid";
import { JPNIcon } from "@components/Icon/agency";
import Card from "@components/Card";
import { DateTime } from "luxon";
import { numFormat } from "@lib/helpers";
import { get } from "@lib/api";
import { OptionType } from "@components/types";
import Daterange from "@components/Dropdown/Daterange";
import { Trans } from "next-i18next";
import { useWatch } from "@hooks/useWatch";
import Spinner from "@components/Spinner";

/**
 * Birthday Explorer Dashboard
 * @overview Status: Live
 */

const Timeseries = dynamic(() => import("@components/Chart/Timeseries"), { ssr: false });

interface BirthdayExplorerDashboardProps {
  timeseries: any;
}

const BirthdayExplorerDashboard: FunctionComponent<BirthdayExplorerDashboardProps> = ({
  timeseries,
}) => {
  const { t, i18n } = useTranslation(["common", "dashboard-birthday-explorer"]);
  const windowWidth = useWindowWidth();

  const filterPeriods: Array<OptionType> = [
    { label: t("dashboard-birthday-explorer:section_2.by_date"), value: "day" },
    { label: t("dashboard-birthday-explorer:section_2.by_month"), value: "month" },
  ];

  const leapTicks: readonly number[] = [0, 31, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335, 365];
  const nonLeapTicks: readonly number[] = [
    0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334, 364,
  ];
  const startYear: number = 1923;
  const endYear: number = 2017;

  const filterYears = (start: number, end: number): Array<OptionType> => {
    return Array(end - start + 1)
      .fill(end)
      .map((year, index) => ({ label: `${year - index}`, value: `${year - index}` }));
  };

  const { data, setData } = useData({
    // consumed data
    x: timeseries.data.x,
    y: timeseries.data.y,
    state_total: 0,
    nationwide_total: 0,
    popularity: {
      year_popular: 0,
      year_rare: 0,
    },

    // query data
    groupBy: "day", // options: "day" | "month"
    birthday: "",
    start: "1923",
    end: "2017",
    state: "mys",

    loading: false,

    // placeholder
    p_birthday: "1996-01-01",
    p_state: "mys",
    validation: "",
  });

  const yieldParams = (birthday: string, state: string = data.state) => {
    let items: Array<[string, any]> = [
      ["explorer", "BIRTHDAY_POPULARITY"],
      ["state", state],
    ];
    if (birthday) items.push(["birthday", birthday]);
    for (const key of ["start", "end", "groupByDay"]) {
      if (key === "groupByDay" && data.groupBy) items.push([key, data.groupBy === "day"]);
      if (data[key]) items.push([key, data[key]]);
    }
    return Object.fromEntries(items);
  };

  const fetchData = (query: ReturnType<typeof yieldParams>) => {
    setData("loading", true);

    get("/explorer", query)
      .then(({ data }) => {
        for (let key in data) {
          setData(key, data[key]);
        }
      })
      .then(() => setData("loading", false));
  };

  useWatch(() => {
    fetchData(yieldParams(data.birthday, data.state));
  }, [data.groupBy, data.start, data.end]);

  const { years, months, days } = useMemo<{ years?: number; months?: number; days?: number }>(
    () =>
      DateTime.now().diff(DateTime.fromISO(data.birthday), ["years", "months", "days"]).toObject(),
    [data.birthday]
  );

  const isLeap = (year: number) => {
    return (year % 4 == 0 && year % 100 != 0) || year % 400 == 0;
  };

  const validateDate = async (): Promise<{ birthday: string; state: string }> =>
    new Promise((resolve, reject) => {
      const year = Number(data.p_birthday.substring(0, 4));
      if (!data.p_birthday && data.p_birthday.length < 10) {
        setData("validation", t("dashboard-birthday-explorer:section_1.validation_incomplete"));
        reject("Invalid date");
      } else if (year > 2017) {
        setData("validation", t("dashboard-birthday-explorer:section_1.validation_max"));
        reject("Date more than maximum");
      } else if (year < 1923) {
        setData("validation", t("dashboard-birthday-explorer:section_1.validation_min"));
        reject("Date less than maximum");
      } else {
        setData("validation", false);
        setData("birthday", data.p_birthday);
        setData("state", data.p_state);
        resolve({ birthday: data.p_birthday, state: data.p_state });
      }
    });

  return (
    <>
      <Hero
        background="blue"
        category={[t("nav.megamenu.categories.demography"), "text-primary"]}
        header={[t("dashboard-birthday-explorer:header")]}
        description={
          <p className={"text-dim dark:text-outline xl:w-2/3"}>
            <Trans>
              {t("dashboard-birthday-explorer:description", {
                quote: t("dashboard-birthday-explorer:quote"),
              })}
            </Trans>
          </p>
        }
        agencyBadge={
          <AgencyBadge
            agency="Jabatan Pendaftaran Negara"
            link="https://www.jpn.gov.my/en/"
            icon={<JPNIcon />}
          />
        }
      />
      <Container className="min-h-screen">
        <Section
          title={t("dashboard-birthday-explorer:section_1.title")}
          description={t("dashboard-birthday-explorer:section_1.description")}
        >
          <div className="flex flex-col gap-8 rounded-xl lg:flex-row">
            <Card
              className="flex basis-1/3 flex-col justify-between rounded-xl border border-outline p-6 dark:border-washed-dark"
              type="gray"
            >
              <div>
                <p className="mb-3 text-sm font-medium text-black dark:text-white">
                  {t("dashboard-birthday-explorer:enter_birthday")}
                </p>
                <Input
                  key={data.p_birthday}
                  type="date"
                  className="py-1.5 text-sm"
                  value={data.p_birthday}
                  onChange={value => setData("p_birthday", value)}
                  required
                  onKeyDown={e => {
                    if (e.key === "Enter")
                      validateDate()
                        .then(({ birthday, state }) => fetchData(yieldParams(birthday, state)))
                        .catch(e => console.error(e));
                  }}
                  min={"1923-01-01"}
                  max={"2017-12-31"}
                  validation={data.validation}
                />
                <p className="mt-6 mb-3 text-sm font-medium text-black dark:text-white">
                  {t("dashboard-birthday-explorer:choose_state")}
                </p>
                <StateDropdown
                  currentState={data.p_state}
                  onChange={selected => setData("p_state", selected.value)}
                  include={[{ label: t("components.ovs"), value: "Overseas" }]}
                  exclude={["kvy"]}
                  width="w-full"
                />
                <Button
                  className="my-6 bg-gradient-to-b from-primary-dark to-primary text-white"
                  onClick={() => {
                    validateDate()
                      .then(({ birthday, state }) => fetchData(yieldParams(birthday, state)))
                      .catch(e => console.error(e));
                  }}
                  icon={<SearchIcon className="h-4 w-4 text-white" />}
                >
                  {t("dashboard-birthday-explorer:search")}
                </Button>
              </div>
              <p className="text-sm text-dim">{t("dashboard-birthday-explorer:disclaimer")}</p>
            </Card>
            <div className="basis-2/3">
              {data.birthday ? (
                !data.loading ? (
                  <Card
                    key={data.birthday}
                    className="flex h-full flex-col gap-6 rounded-xl border border-outline py-8 dark:border-washed-dark lg:flex-row lg:pl-8"
                  >
                    <Card className="my-0 flex h-auto w-full basis-1/3 flex-col self-center rounded-t-xl border border-outline bg-background px-4 py-8 dark:border-washed-dark dark:bg-washed-dark/50 lg:rounded-xl lg:py-16">
                      <CakeIcon className="mx-auto h-10 w-10 text-primary" />
                      <div className="mx-auto mt-4 text-center text-lg font-bold text-black dark:text-white">
                        {DateTime.fromISO(data.birthday)
                          .setLocale(i18n.language)
                          .toLocaleString(DateTime.DATE_FULL)}
                      </div>
                      <div className="mx-auto mt-3 text-center text-sm text-dim">
                        {t("dashboard-birthday-explorer:section_1.age", {
                          years,
                          months,
                          days: numFormat(days!, "standard", 0),
                        })}
                      </div>
                    </Card>
                    <div className="flex h-auto basis-2/3 flex-col gap-3 self-center px-4 pb-4 text-lg font-bold lg:pt-4 lg:pl-0 lg:pr-8">
                      <div className="space-y-3 text-black dark:text-white">
                        <p>
                          {t("dashboard-birthday-explorer:section_1.info1", {
                            count: data.state_total,
                          })}

                          <span className="text-primary dark:text-primary-dark">
                            {t("dashboard-birthday-explorer:section_1.count", {
                              count: data.state_total,
                            })}
                          </span>
                          {t("dashboard-birthday-explorer:section_1.info2", {
                            count: data.state_total,
                            context: data.state === "Overseas" && "overseas",
                          })}

                          <span className="text-primary dark:text-primary-dark">
                            {data.state === "Overseas"
                              ? t("dashboard-birthday-explorer:section_1.overseas")
                              : CountryAndStates[data.state]}
                          </span>
                          {data.state !== "mys" ? (
                            <>
                              <span>{t("dashboard-birthday-explorer:section_1.and")}</span>
                              <span className="text-primary dark:text-primary-dark">
                                {t("dashboard-birthday-explorer:section_1.count", {
                                  count: data.nationwide_total,
                                })}
                              </span>
                              <span>
                                {t("dashboard-birthday-explorer:section_1.info3", {
                                  count: data.nationwide_total,
                                })}
                              </span>
                            </>
                          ) : (
                            "."
                          )}
                        </p>
                        <p>
                          {t("dashboard-birthday-explorer:section_1.info6", {
                            year: data.birthday.slice(0, 4),
                          })}
                          <span className="text-primary dark:text-primary-dark">
                            {t("dashboard-birthday-explorer:section_1.rank", {
                              count: data.rank,
                              ordinal: true,
                              context: [365, 366].includes(data.rank) && "least",
                            })}
                          </span>
                          {t("dashboard-birthday-explorer:section_1.popularity", {
                            count: isLeap(+data.birthday.slice(0, 4)) ? 366 : 365,
                            year: +data.birthday.slice(0, 4),
                            context: [1, 365, 366].includes(data.rank) ? "without" : "most",
                          })}
                          {data.rank === 1
                            ? ""
                            : t("dashboard-birthday-explorer:section_1.popular", {
                                context: data.rank === data.y.length && "while",
                              })}
                          {data.rank === 1
                            ? ""
                            : t("dashboard-birthday-explorer:section_1.most_popular", {
                                count: new Date(data.popularity.year_popular).getDate(),
                                ordinal: true,
                                month: new Intl.DateTimeFormat(i18n.language, {
                                  month: "long",
                                }).format(new Date(data.popularity.year_popular)),
                              })}
                          {t("dashboard-birthday-explorer:section_1.rare", {
                            context: data.rank === data.y.length && "none",
                          })}
                          {data.rank === data.y.length
                            ? ""
                            : t("dashboard-birthday-explorer:section_1.most_rare", {
                                count: new Date(data.popularity.year_rare).getDate(),
                                ordinal: true,
                                month: new Intl.DateTimeFormat(i18n.language, {
                                  month: "long",
                                }).format(new Date(data.popularity.year_rare)),
                              })}
                        </p>
                        <p className="text-sm font-normal text-dim dark:text-white">
                          {t("dashboard-birthday-explorer:section_1.explore")}
                        </p>
                      </div>
                    </div>
                  </Card>
                ) : (
                  <Card className="flex h-full flex-col gap-6 rounded-xl border border-outline py-8 dark:border-washed-dark lg:flex-row lg:pl-8">
                    <Card className="mx-auto flex h-min w-fit flex-row gap-2 self-center py-1.5 px-3">
                      <Spinner loading={data.loading} />
                    </Card>
                  </Card>
                )
              ) : (
                <Card className="hidden h-full items-center gap-6 rounded-xl border border-outline py-8 dark:border-washed-dark lg:flex">
                  <Card className="mx-auto flex h-min w-fit flex-row gap-2 self-center rounded-md border border-outline bg-outline py-1.5 px-3 dark:border-washed-dark dark:bg-washed-dark">
                    <SearchIcon className="mx-auto mt-1 h-4 w-4 text-black dark:text-white" />
                    <p>{t("dashboard-birthday-explorer:start_search")}</p>
                  </Card>
                </Card>
              )}
            </div>
          </div>
        </Section>

        {/* Number of babies born on each date */}
        <Section
          className="py-12"
          title={
            data.start === data.end
              ? t("dashboard-birthday-explorer:section_2.sameyear", {
                  year: data.start,
                  state:
                    data.state === "Overseas"
                      ? t("dashboard-birthday-explorer:section_2.overseas")
                      : CountryAndStates[data.state ? data.state : "mys"],
                })
              : t("dashboard-birthday-explorer:section_2.title", {
                  start_year: data.start,
                  end_year: data.end,
                  state:
                    data.state === "Overseas"
                      ? t("dashboard-birthday-explorer:section_2.overseas")
                      : CountryAndStates[data.state ? data.state : "mys"],
                })
          }
          date={timeseries.data_as_of}
        >
          <div className="flex justify-start gap-2 pb-2">
            <Dropdown
              className="dark:hover:border-outlineHover-dark dark:hover:bg-washed-dark/50"
              anchor={"left"}
              width={"w-fit"}
              options={filterPeriods}
              placeholder={t("catalogue.period")}
              selected={filterPeriods.find(period => period.value === data.groupBy)}
              onChange={({ value }) => setData("groupBy", value)}
            />
            <Daterange
              className="dark:hover:border-outlineHover-dark dark:hover:bg-washed-dark/50"
              beginOptions={filterYears(startYear, endYear).slice().reverse()}
              endOptions={filterYears(startYear, endYear)}
              anchor={"left"}
              selected={[
                filterYears(startYear, endYear).find(item => item.value === data.start),
                filterYears(startYear, endYear).find(item => item.value === data.end),
              ]}
              onChange={([begin, end]) => {
                if (begin) setData("start", begin.value);
                if (end) setData("end", end.value);
              }}
              onReset={() => {
                setData("start", "1923");
                setData("end", "2017");
              }}
            />
          </div>
          {!data.loading ? (
            <Timeseries
              className="h-[350px] w-full"
              interval={data.groupBy}
              round={data.groupBy}
              enableGridX={false}
              enableGridY={true}
              gridOffsetX={data.groupBy === "day" ? false : true}
              tickXCallback={(val: number | string, index: number) => {
                if (data.groupBy !== "day") return val;
                const x = data.y.length > 365 ? leapTicks : nonLeapTicks;
                return x.includes(index) ? val : null;
              }}
              tooltipFormat={data.groupBy === "day" ? "dd MMMM" : "MMMM"}
              data={{
                labels: data.x,
                datasets: [
                  {
                    type: data.groupBy === "day" ? "line" : "bar",
                    data: data.y,
                    label: t("dashboard-birthday-explorer:section_2.births"),
                    backgroundColor: AKSARA_COLOR.PRIMARY_H,
                    borderColor: AKSARA_COLOR.PRIMARY,
                    borderWidth:
                      windowWidth <= BREAKPOINTS.MD
                        ? 0.75
                        : windowWidth <= BREAKPOINTS.LG
                        ? 1.0
                        : 1.5,
                    fill: true,
                  },
                ],
              }}
            />
          ) : (
            <div className="flex h-[350px] w-full">
              <div className="mx-auto self-center">
                <Spinner loading={data.loading} />
              </div>
            </div>
          )}
        </Section>
      </Container>
    </>
  );
};

export default BirthdayExplorerDashboard;
