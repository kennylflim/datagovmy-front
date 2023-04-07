import { GetServerSideProps, InferGetServerSidePropsType } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { Page } from "@lib/types";
import Metadata from "@components/Metadata";
import { useTranslation } from "@hooks/useTranslation";
import Dashboard from "@dashboards/index";
import { get } from "@lib/api";

const DashboardIndex: Page = ({
  analytics,
  dashboards,
  query,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const { t } = useTranslation(["common"]);

  return (
    <>
      <Metadata title={t("nav.dashboards")} description={""} keywords={""} />
      <Dashboard
        query={query}
        sources={["DOSM", "MAMPU", "PDN", "BNM"]}
        analytics={analytics}
        dashboards={dashboards}
      />
    </>
  );
};

export const getServerSideProps: GetServerSideProps = async ({ locale, query }) => {
  const i18n = await serverSideTranslations(locale!, ["common"], null, ["en-GB", "ms-MY"]);

  const { data } = await get("/dashboard/", { dashboard: "dashboards" });

  return {
    props: {
      ...i18n,
      query: query ?? {},
      data: data,
      timeseries: [],
      analytics: {
        data_as_of: data.dashboards_top.data_as_of,
        en: {
          today: data.dashboards_top.data.en.today,
          last_month: data.dashboards_top.data.en.last_month,
          all_time: data.dashboards_top.data.en.all_time,
        },
        bm: {
          today: data.dashboards_top.data.bm.today,
          last_month: data.dashboards_top.data.bm.last_month,
          all_time: data.dashboards_top.data.bm.all_time,
        },
      },
      data_as_of: data.dashboards_all.data_as_of,
      dashboards: data.dashboards_all.data,
    },
  };
};

export default DashboardIndex;
