import Layout from "@components/Layout";
import { Metadata, StateDropdown, StateModal } from "datagovmy-ui/components";
import CovidVaccinationDashboard from "@dashboards/covid-vaccination";
import { get } from "datagovmy-ui/api";
import { CountryAndStates } from "datagovmy-ui/constants";
import { withi18n } from "datagovmy-ui/decorators";
import { routes } from "@lib/routes";
import { Page } from "datagovmy-ui/types";
import { InferGetStaticPropsType, GetStaticProps, GetStaticPaths } from "next";
import { useTranslation } from "datagovmy-ui/hooks";
import { WindowProvider } from "datagovmy-ui/contexts/window";
import { AnalyticsProvider } from "datagovmy-ui/contexts/analytics";
import { sortMsiaFirst } from "datagovmy-ui/helpers";

/**
 * Covid Vaccination Page <State>
 */

const CovidVaccinationState: Page = ({
  meta,
  last_updated,
  params,
  waffle,
  barmeter,
  timeseries,
  statistics,
  table,
}: InferGetStaticPropsType<typeof getStaticProps>) => {
  const { t } = useTranslation(["dashboard-covid-vaccination", "common"]);
  return (
    <AnalyticsProvider meta={meta}>
      <Metadata
        title={[t("page_title"), "·", CountryAndStates[params.state]].join(" ")}
        description={t("description")}
        keywords=""
      />
      <CovidVaccinationDashboard
        last_updated={last_updated}
        params={params}
        waffle={waffle}
        barmeter={barmeter}
        timeseries={timeseries}
        statistics={statistics}
        table={table}
      />
    </AnalyticsProvider>
  );
};

CovidVaccinationState.layout = (page, props) => (
  <WindowProvider>
    <Layout
      stateSelector={
        <StateDropdown
          width="w-max xl:w-64"
          url={routes.COVID_VACCINATION}
          currentState={props?.params.state}
          hideOnScroll
        />
      }
    >
      <StateModal url={routes.COVID_VACCINATION} state={props.params.state} />
      {page}
    </Layout>
  </WindowProvider>
);

export const getStaticPaths: GetStaticPaths = () => {
  return {
    paths: [],
    fallback: "blocking",
  };
};

export const getStaticProps: GetStaticProps = withi18n(
  ["dashboard-covid-vaccination", "common"],
  async ({ params }) => {
    const state = params?.state ? params.state[0] : "mys";
    const { data } = await get("/dashboard", { dashboard: "covid_vax", state: state });
    data.snapshot.data = sortMsiaFirst(data.snapshot.data, "state");

    return {
      props: {
        meta: {
          id: "dashboard-covid-vaccination",
          type: "dashboard",
          category: "healthcare",
          agency: "KKM",
        },
        params: { state },
        last_updated: data.data_last_updated,
        waffle: data.waffle,
        barmeter: data.bar_chart,
        timeseries: data.timeseries,
        statistics: data.statistics,
        table: data.snapshot,
      },
    };
  }
);

export default CovidVaccinationState;
