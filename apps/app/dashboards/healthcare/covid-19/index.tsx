import { FunctionComponent } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useRouter } from "next/router";
import {
  AgencyBadge,
  Container,
  Hero,
  Panel,
  Section,
  StateDropdown,
  Tabs,
} from "@components/index";
import { MOHIcon } from "@components/Icon/agency";
import Slider from "@components/Chart/Slider";
import Stages from "@components/Chart/Stages";
import { useData } from "@hooks/useData";
import { useSlice } from "@hooks/useSlice";
import { useTranslation } from "@hooks/useTranslation";
import { routes } from "@lib/routes";
import { CountryAndStates } from "@lib/constants";
import { numFormat } from "@lib/helpers";
import { SliderProvider } from "@components/Chart/Slider/context";

/**
 * COVID19 Dashboard
 * @overview Status: Live
 */

const BarMeter = dynamic(() => import("@components/Chart/BarMeter"), { ssr: false });
const Timeseries = dynamic(() => import("@components/Chart/Timeseries"), { ssr: false });

interface COVID19Props {
  params: Record<string, any>;
  last_updated: number;
  snapshot_bar: any;
  snapshot_graphic: any;
  timeseries: any;
  //   timeseries_admitted: any;
  //   timeseries_cases: any;
  //   timeseries: any;
  //   timeseries_icu: any;
  //   timeseries_tests: any;
  //   timeseries_vents: any;
  util_chart: any;
  statistics: any;
}

const COVID19: FunctionComponent<COVID19Props> = ({
  params,
  last_updated,
  snapshot_bar,
  snapshot_graphic,
  timeseries,
  //   timeseries_admitted,
  //   timeseries_cases,
  //   timeseries,
  //   timeseries_icu,
  //   timeseries_tests,
  //   timeseries_vents,
  util_chart,
  statistics,
}) => {
  const currentState = params.state;
  const { t } = useTranslation(["dashboard-covid-19", "common"]);

  const filterCaseDeath = [
    { label: "Cases", value: "cases" },
    { label: "Deaths", value: "deaths" },
  ];

  const { data, setData } = useData({
    show_indicator: {
      label: t(`opt_${filterCaseDeath[0].value}`),
      value: filterCaseDeath[0].value,
    },
    filter_death: 0,
    filter_state: 0,
    filter_cases: 0,
    minmax: [timeseries.data.x.length - 365, timeseries.data.x.length - 1],
  });

  // TODO: Can be grouped into 1. Have to do a bit of transforming
  const { coordinate } = useSlice(timeseries.data, data.minmax);
  //   const { coordinate: coordinate } = useSlice(timeseries_cases.data, data.minmax);
  //   const { coordinate: coordinate } = useSlice(timeseries.data, data.minmax);
  //   const { coordinate: coordinate } = useSlice(timeseries_icu.data, data.minmax);
  //   const { coordinate: coordinate } = useSlice(timeseries_tests.data, data.minmax);
  //   const { coordinate: coordinate } = useSlice(timeseries_vents.data, data.minmax);

  const BarTabsMenu = [
    {
      name: t("tab_table2"),
      title: t("tab_table2") + " per 100K",
      data: snapshot_bar.data.deaths,
    },
    {
      name: "Vent.",
      title: t("utilisation_of", { param: "Vent." }).concat(" (%)"),
      data: snapshot_bar.data.util_vent,
      unit: "%",
    },
    {
      name: "ICU",
      title: t("utilisation_of", { param: "ICU" }).concat(" (%)"),
      data: snapshot_bar.data.util_icu,
      unit: "%",
    },
    {
      name: "Hosp.",
      title: t("utilisation_of", { param: "Hosp." }).concat(" (%)"),
      data: snapshot_bar.data.util_hosp,
      unit: "%",
    },
    {
      name: t("tab_table4"),
      title: t("tab_table4") + " per 100K",
      data: snapshot_bar.data.cases,
    },
  ];

  return (
    <>
      <Hero
        background="red"
        category={[t("common:nav.megamenu.categories.healthcare"), "text-danger"]}
        header={[t("header")]}
        description={
          <>
            <p className={"text-dim xl:w-2/3"}>{t("description")}</p>
            <div className="pt-3">
              <StateDropdown url={routes.COVID_19} currentState={currentState} />
            </div>
          </>
        }
        agencyBadge={
          <AgencyBadge
            agency={"Ministry of Health (MoH)"}
            link="https://www.moh.gov.my"
            icon={<MOHIcon />}
          />
        }
        last_updated={last_updated}
      />

      <Container className="min-h-screen">
        {/* What does the latest data show? */}
        <Section
          title={t("diagram_header", { state: CountryAndStates[currentState] })}
          date={snapshot_graphic.data_as_of}
        >
          <div className="grid grid-cols-1 gap-12 pb-6 lg:grid-cols-2 xl:grid-cols-5">
            <div className="col-span-1 xl:col-span-3">
              <Stages
                title={t("diagram_subheader", {
                  state: CountryAndStates[currentState],
                })}
                className="h-full pt-4"
                data={{
                  header: {
                    name: t("diagram_title"),
                    value: snapshot_graphic.data.cases_active,
                    delta: snapshot_graphic.data.cases_active_annot,
                    inverse: true,
                  },
                  col_1: [
                    {
                      name: t("col1_title1"),
                      value: snapshot_graphic.data.cases_local,
                      delta: snapshot_graphic.data.cases_local_annot,
                      inverse: true,
                      icon: (
                        <Image
                          src="/static/images/stages/virus.svg"
                          height={32}
                          width={32}
                          alt="Local Cases"
                        />
                      ),
                    },
                    {
                      name: t("col1_title2"),
                      value: snapshot_graphic.data.cases_import,
                      delta: snapshot_graphic.data.cases_import_annot,
                      inverse: true,
                    },
                  ],
                  col_2: [
                    {
                      name: t("col2_title1"),
                      value: snapshot_graphic.data.home,
                      delta: snapshot_graphic.data.home_annot,
                      unit: "%",
                      icon: (
                        <Image
                          src="/static/images/stages/home-quarantine.svg"
                          height={32}
                          width={32}
                          alt="Home Quarantine"
                        />
                      ),
                    },
                    {
                      name: t("col2_title2"),
                      value: snapshot_graphic.data.pkrc,
                      delta: snapshot_graphic.data.pkrc_annot,
                      unit: "%",
                      icon: (
                        <Image
                          src="/static/images/stages/pkrc.svg"
                          height={32}
                          width={32}
                          alt="PKRC"
                        />
                      ),
                    },
                    {
                      name: t("col2_title3"),
                      value: snapshot_graphic.data.hosp,
                      delta: snapshot_graphic.data.hosp_annot,
                      unit: "%",
                      icon: (
                        <Image
                          src="/static/images/stages/hospitalised.svg"
                          height={32}
                          width={32}
                          alt="Hospitalised"
                        />
                      ),
                    },
                    {
                      name: t("col2_title4"),
                      value: snapshot_graphic.data.icu,
                      delta: snapshot_graphic.data.icu_annot,
                      unit: "%",
                      icon: (
                        <Image
                          src="/static/images/stages/icu-unventilated.svg"
                          height={32}
                          width={32}
                          alt="ICU (Unventilated)"
                        />
                      ),
                    },
                    {
                      name: t("col2_title5"),
                      value: snapshot_graphic.data.vent,
                      delta: snapshot_graphic.data.vent_annot,
                      unit: "%",
                      icon: (
                        <Image
                          src="/static/images/stages/icu-ventilated.svg"
                          height={32}
                          width={32}
                          alt="ICU (Ventilated)"
                        />
                      ),
                    },
                  ],
                  col_3: [
                    {
                      name: t("col3_title1"),
                      value: snapshot_graphic.data.recovered,
                      delta: snapshot_graphic.data.recovered_annot,
                      icon: (
                        <Image
                          src="/static/images/stages/recovered.svg"
                          height={32}
                          width={32}
                          alt="Recovered"
                        />
                      ),
                    },
                    {
                      name: t("col3_title2"),
                      value: snapshot_graphic.data.deaths,
                      delta: snapshot_graphic.data.deaths_annot,
                      inverse: true,
                      icon: (
                        <Image
                          src="/static/images/stages/death.svg"
                          height={32}
                          width={32}
                          alt="Deaths (Including BID)"
                        />
                      ),
                    },
                    {
                      name: t("col3_title3"),
                      value: snapshot_graphic.data.deaths_bid,
                      delta: snapshot_graphic.data.deaths_bid_annot,
                      inverse: true,
                    },
                  ],
                }}
              />
            </div>
            <div className="col-span-1 xl:col-span-2">
              <Tabs
                title={BarTabsMenu[data.filter_state].title}
                className="w-full"
                onChange={value => setData("filter_state", value)}
              >
                {BarTabsMenu.map(({ name, data, unit }, index) => {
                  return (
                    <Panel key={index} name={name}>
                      <BarMeter
                        className="block pt-4"
                        data={data}
                        layout="state-horizontal"
                        relative
                        sort="desc"
                        unit={unit}
                      />
                    </Panel>
                  );
                })}
              </Tabs>
            </div>
          </div>
        </Section>

        {/* How are COVID-19 key indicators trending */}
        <Section
          title={t("area_chart_header", {
            state: CountryAndStates[currentState],
          })}
          date={timeseries.data_as_of}
        >
          <SliderProvider>
            {play => (
              <>
                <div className="grid grid-cols-1 gap-12 pb-6 lg:grid-cols-2 xl:grid-cols-3">
                  <Timeseries
                    className="h-[250px] w-full"
                    title={t("area_chart_title1")}
                    enableAnimation={!play}
                    stats={[
                      {
                        title: t("deaths.annot1"),
                        value: numFormat(statistics.data.deaths.annot1, "standard"),
                      },
                      {
                        title: t("deaths.annot2"),
                        value: numFormat(statistics.data.deaths.annot2, "standard"),
                      },
                    ]}
                    data={{
                      labels: coordinate.x,
                      datasets: [
                        {
                          type: "line",
                          label: `${t("area_chart_tooltip1")}`,
                          pointRadius: 0,
                          data: coordinate.deaths_line,
                          borderColor: "#2563EB",
                          borderWidth: 1.5,
                        },
                        {
                          type: "bar",
                          label: `${t("area_chart_tooltip2")}`,
                          data: coordinate.deaths_inpatient,
                          backgroundColor: "#6BABFA",
                          stack: "same",
                        },
                        {
                          type: "bar",
                          label: `${t("area_chart_tooltip3")}`,
                          data: coordinate.deaths_brought_in,
                          backgroundColor: "#2563EB4D",
                          stack: "same",
                        },
                      ],
                    }}
                    enableGridX={false}
                  />
                  <Timeseries
                    className="h-[250px] w-full"
                    title={t("area_chart_title2")}
                    enableAnimation={!play}
                    stats={[
                      {
                        title: t("vent.annot1"),
                        value: numFormat(statistics.data.vent.annot1, "standard"),
                      },
                      {
                        title: t("vent.annot2"),
                        value: numFormat(statistics.data.vent.annot2, "standard").concat("%"),
                      },
                    ]}
                    data={{
                      labels: coordinate.x,
                      datasets: [
                        {
                          type: "line",
                          label: `${t("area_chart2_tooltip1")}`,
                          pointRadius: 0,
                          data: coordinate.vents_line,
                          borderColor: "#2563EB",
                          borderWidth: 1.5,
                        },
                        {
                          type: "bar",
                          label: `${t("area_chart2_tooltip2")}`,
                          data: coordinate.vents,
                          backgroundColor: "#2563EB4D",
                          stack: "same",
                        },
                      ],
                    }}
                    enableGridX={false}
                  />
                  <Timeseries
                    className="h-[250px] w-full"
                    title={t("area_chart_title3")}
                    enableAnimation={!play}
                    stats={[
                      {
                        title: t("icu.annot1"),
                        value: numFormat(statistics.data.icu.annot1, "standard"),
                      },
                      {
                        title: t("icu.annot2"),
                        value: numFormat(statistics.data.icu.annot2, "standard").concat("%"),
                      },
                    ]}
                    data={{
                      labels: coordinate.x,
                      datasets: [
                        {
                          type: "line",
                          label: `${t("area_chart3_tooltip1")}`,
                          pointRadius: 0,
                          data: coordinate.icu_line,
                          borderColor: "#2563EB",
                          borderWidth: 1.5,
                        },
                        {
                          type: "bar",
                          label: `${t("area_chart3_tooltip2")}`,
                          data: coordinate.icu,
                          backgroundColor: "#2563EB4D",
                          stack: "same",
                        },
                      ],
                    }}
                    enableGridX={false}
                  />
                  <Timeseries
                    className="h-[250px] w-full"
                    title={t("area_chart_title4")}
                    enableAnimation={!play}
                    stats={[
                      {
                        title: t("admitted.annot1"),
                        value: numFormat(statistics.data.admitted.annot1, "standard"),
                      },
                      {
                        title: t("admitted.annot2"),
                        value: numFormat(statistics.data.admitted.annot2, "standard").concat("%"),
                      },
                    ]}
                    data={{
                      labels: coordinate.x,
                      datasets: [
                        {
                          type: "line",
                          label: `${t("area_chart4_tooltip1")}`,
                          pointRadius: 0,
                          data: coordinate.admitted_line,
                          borderColor: "#2563EB",
                          borderWidth: 1.5,
                        },
                        {
                          type: "bar",
                          label: `${t("area_chart4_tooltip2")}`,
                          data: coordinate.admitted,
                          backgroundColor: "#2563EB4D",
                          stack: "same",
                        },
                      ],
                    }}
                    enableGridX={false}
                  />
                  <Timeseries
                    className="h-[250px] w-full"
                    title={t("area_chart_title5")}
                    enableAnimation={!play}
                    stats={[
                      {
                        title: t("cases.annot1"),
                        value: numFormat(statistics.data.cases.annot1, "standard"),
                      },
                      {
                        title: t("cases.annot2"),
                        value: numFormat(statistics.data.cases.annot2, "standard"),
                      },
                    ]}
                    data={{
                      labels: coordinate.x,
                      datasets: [
                        {
                          type: "line",
                          label: `${t("area_chart5_tooltip1")}`,
                          pointRadius: 0,
                          data: coordinate.cases_line,
                          borderColor: "#2563EB",
                          borderWidth: 1.5,
                        },
                        {
                          type: "bar",
                          label: `${t("area_chart5_tooltip2")}`,
                          data: coordinate.cases,
                          backgroundColor: "#2563EB4D",
                          stack: "same",
                        },
                      ],
                    }}
                    enableGridX={false}
                  />
                  <Timeseries
                    className="h-[250px] w-full"
                    title={t("area_chart_title6")}
                    enableAnimation={!play}
                    stats={[
                      {
                        title: t("tests.annot1"),
                        value: numFormat(statistics.data.tests.annot1, "standard"),
                      },
                      {
                        title: t("tests.annot2"),
                        value: numFormat(statistics.data.tests.annot2, "standard").concat("%"),
                      },
                    ]}
                    enableRightScale
                    data={{
                      labels: coordinate.x,
                      datasets: [
                        {
                          type: "line",
                          label: `${t("area_chart6_tooltip1")}`,
                          pointRadius: 0,
                          borderColor: "#2563EB",
                          data: coordinate.tests_tooltip,
                          borderWidth: 1.5,
                          yAxisID: "y1",
                          spanGaps: true,
                        },
                        {
                          type: "bar",
                          label: `${t("area_chart6_tooltip2")}`,
                          data: coordinate.tests_rtk,
                          backgroundColor: "#6BABFA",
                          stack: "same",
                        },
                        {
                          type: "bar",
                          label: `${t("area_chart6_tooltip3")}`,
                          data: coordinate.tests_pcr,
                          backgroundColor: "#2563EB4D",
                          stack: "same",
                        },
                      ],
                    }}
                    enableGridX={false}
                  />
                </div>
                <div>
                  <Slider
                    type="range"
                    data={timeseries.data.x}
                    value={data.minmax}
                    onChange={e => setData("minmax", e)}
                  />
                  <span className="text-dim text-sm">{t("common:common.slider")}</span>
                </div>
              </>
            )}
          </SliderProvider>
        </Section>
      </Container>
    </>
  );
};

export default COVID19;
