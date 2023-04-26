import { FunctionComponent, ReactNode, useEffect } from "react";
import dynamic from "next/dynamic";
import { Trans } from "next-i18next";
import { BarMeter, Lost, Won } from "@components/Chart/Table/BorderlessTable";
import ElectionCard from "@components/Card/ElectionCard";
import ComboBox from "@components/Combobox";
import ImageWithFallback from "@components/ImageWithFallback";
import { Panel, Section, StateDropdown, Tabs } from "@components/index";
import { OptionType } from "@components/types";
import { ArrowsPointingOutIcon } from "@heroicons/react/24/solid";
import { useData } from "@hooks/useData";
import { useTranslation } from "@hooks/useTranslation";
import { CountryAndStates } from "@lib/constants";
import { numFormat } from "@lib/helpers";
import { ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { useWatch } from "@hooks/useWatch";
import { get } from "@lib/api";
import { DateTime } from "luxon";

/**
 * Election Explorer Dashboard - Political Parties Tab
 * @overview Status: In-development
 */

const BorderlessTable = dynamic(() => import("@components/Chart/Table/BorderlessTable"), {
  ssr: false,
});

interface ElectionPartiesProps {
  party: any;
}

const ElectionParties: FunctionComponent<ElectionPartiesProps> = ({ party }) => {
  const { t, i18n } = useTranslation(["dashboard-election-explorer", "common"]);

  const { data, setData } = useData({
    data: party,
    party_list: [],
    state: "mys",
    tabs: 0,
    index: 0,
    open: false,
    result: [],
    // placeholder
    p_party: "",

    // query
    q_party: "PERIKATAN",
    loading: false,
    modalLoading: false,
  });

  type Party = {
    election_name: string;
    date: string;
    seats: Record<string, number>;
    votes: Record<string, number>;
    result: string;
  };

  const columnHelper = createColumnHelper<Party>();

  const results: { [key: string]: ReactNode } = {
    formed_gov: <Won desc={t("party.formed_gov")} />,
    formed_opp: <Lost desc={t("party.formed_opp")} />,
  };

  const columns: ColumnDef<Party, any>[] = [
    columnHelper.accessor("election_name", {
      id: "election_name",
      header: t("election_name"),
      cell: (info: any) => info.getValue(),
    }),
    columnHelper.accessor((row: any) => row.date, {
      id: "date",
      header: t("date"),
      cell: (info: any) => info.getValue(),
    }),
    columnHelper.accessor("seats", {
      id: "seats",
      header: t("seats_won"),
      cell: (info: any) => {
        const seats = info.getValue();
        return (
          <div className="flex flex-row items-center gap-2">
            <BarMeter perc={seats.perc} />
            <p>{`${seats.abs === 0 ? "—" : seats.won + "/" + seats.total} ${
              seats.perc !== null ? `(${+seats.perc.toFixed(1)}%)` : ""
            }`}</p>
          </div>
        );
      },
    }),
    columnHelper.accessor("votes", {
      id: "votes",
      header: t("votes_won"),
      cell: (info: any) => {
        const votes = info.getValue();
        return (
          <div className="flex flex-row items-center gap-2">
            <BarMeter perc={votes.perc} />
            <p>{`${votes.abs === 0 ? "—" : numFormat(votes.abs, "standard")} ${
              votes.perc !== null ? `(${+votes.perc.toFixed(1)}%)` : ""
            }`}</p>
          </div>
        );
      },
    }),
    columnHelper.display({
      id: "fullResult",
      cell: ({ row }) => {
        return (
          <div className="flex items-center justify-center">
            <button
              className="flex flex-row items-center gap-1.5 px-2 text-sm font-medium hover:bg-opacity-30 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75"
              onClick={() => {
                setData("open", true);
                setData("index", row.index);
              }}
            >
              <ArrowsPointingOutIcon className="h-4 w-4 text-black dark:text-white" />
              <p>{t("full_result")}</p>
            </button>
          </div>
        );
      },
    }),
  ];

  type Result = {
    name: string;
    party: string;
    seats: Record<string, number>;
    votes: Record<string, number>;
  };

  const resultsColumnHelper = createColumnHelper<Result>();

  const resultsColumns: ColumnDef<Result, any>[] = [
    resultsColumnHelper.accessor("party", {
      id: "party",
      header: t("party_name"),
      cell: (info: any) => {
        const party = info.getValue() as string;
        return (
          <div className="flex flex-row items-center gap-2 pr-7 xl:pr-0">
            <ImageWithFallback
              src={`/static/images/parties/${party}.png`}
              width={28}
              height={16}
              alt={t(`${party}`)}
            />
            <span>{t(`${party}`)}</span>
          </div>
        );
      },
    }),
    resultsColumnHelper.accessor("seats", {
      id: "seats",
      header: t("seats_won"),
      cell: (info: any) => {
        const seats = info.getValue();
        return (
          <div className="flex flex-row items-center gap-2">
            <BarMeter perc={seats.perc} />
            <p>{`${seats.abs === 0 ? "—" : seats.won + "/" + seats.total} ${
              seats.perc !== null ? `(${+seats.perc.toFixed(1)}%)` : ""
            }`}</p>
          </div>
        );
      },
    }),
    resultsColumnHelper.accessor("votes", {
      id: "votes",
      header: t("votes_won"),
      cell: (info: any) => {
        const votes = info.getValue();
        return (
          <div className="flex flex-row items-center gap-2">
            <BarMeter perc={votes.perc} />
            <p>{`${votes.abs === 0 ? "—" : numFormat(votes.abs, "standard")} ${
              votes.perc !== null ? `(${+votes.perc.toFixed(1)}%)` : ""
            }`}</p>
          </div>
        );
      },
    }),
  ];

  const PARTY_OPTIONS: Array<OptionType> =
    data.party_list &&
    data.party_list.map((key: string) => ({
      label: t(`${key}`),
      value: key,
    }));

  useEffect(() => {
    get("/explorer", {
      explorer: "ELECTIONS",
      dropdown: "party_list",
    }).then(({ data }) => {
      setData("party_list", data);
    });
  }, []);

  useWatch(() => {
    setData("loading", true);
    get("/explorer", {
      explorer: "ELECTIONS",
      chart: "party",
      party_name: data.q_party,
      type: data.tabs === 0 ? "parlimen" : "dun",
      state: data.state,
    })
      .then(({ data }) => {
        setData("data", data.reverse());
      })
      .then(() => setData("loading", false));
  }, [data.q_party, data.state, data.tabs]);

  useWatch(() => {
    setData("modalLoading", true);
    get("/explorer", {
      explorer: "ELECTIONS",
      chart: "full_result",
      type: "party",
      election: data.data[data.index].election_name,
      state: data.state,
    })
      .then(({ data }) => {
        setData("result", data);
      })
      .then(() => setData("modalLoading", false));
  }, [data.index, data.open]);

  return (
    <Section>
      <div className="lg:grid lg:grid-cols-12">
        <div className="lg:col-span-10 lg:col-start-2">
          <h4 className="text-center">{t("party.header")}</h4>
          <div className="grid grid-cols-12 pb-12 pt-6 lg:grid-cols-10">
            <div className="col-span-10 col-start-2 sm:col-span-8 sm:col-start-3 md:col-span-6 md:col-start-4 lg:col-span-4 lg:col-start-4">
              <ComboBox
                placeholder={t("party.search_party")}
                options={PARTY_OPTIONS}
                selected={
                  data.p_party ? PARTY_OPTIONS.find(e => e.value === data.p_party.value) : null
                }
                onChange={e => {
                  if (e) setData("q_party", e.value.toUpperCase());
                  setData("party", e);
                }}
                enableFlag
              />
            </div>
          </div>
          <Tabs
            title={
              <Trans>
                <span className="text-lg font-normal leading-9">
                  <ImageWithFallback
                    className="mr-2 inline-flex items-center"
                    src={`/static/images/parties/${data.q_party}.png`}
                    width={28}
                    height={16}
                    alt={t(`${data.q_party}`)}
                  />
                  {t("party.title", {
                    party: `$t(${data.q_party})`,
                  })}
                  <StateDropdown
                    currentState={data.state}
                    onChange={selected => setData("state", selected.value)}
                    width="inline-block pl-1 min-w-max"
                    anchor="left"
                  />
                </span>
              </Trans>
            }
            current={data.tabs}
            onChange={index => setData("tabs", index)}
          >
            <Panel name={t("parliament_elections")}>
              <BorderlessTable
                data={data.data}
                columns={columns}
                isLoading={data.loading}
                empty={
                  <Trans>
                    {t("party.no_data", {
                      party: `$t(${data.q_party})`,
                      context: "parliament",
                    })}
                  </Trans>
                }
              />
            </Panel>
            <Panel name={t("state_elections")}>
              <BorderlessTable
                data={data.data}
                columns={columns}
                isLoading={data.loading}
                empty={
                  <Trans>
                    {t("party.no_data", {
                      party: `$t(${data.q_party})`,
                      state: CountryAndStates[data.state],
                      context: data.state === "mys" ? "dun_mys" : "dun",
                    })}
                  </Trans>
                }
              />
            </Panel>
          </Tabs>
        </div>
      </div>
      {data.open && (
        <ElectionCard
          open={data.open}
          onClose={() => setData("open", false)}
          onNext={() => (data.index === data.data.length ? null : setData("index", data.index + 1))}
          onPrev={() => (data.index === 0 ? null : setData("index", data.index - 1))}
          election_name={data.data[data.index].election_name}
          date={DateTime.fromISO(data.data[data.index].date)
            .setLocale(i18n.language)
            .toLocaleString(DateTime.DATE_MED)}
          title={
            <div className="flex flex-row gap-2 uppercase">
              <h5>{data.data[data.index].election_name.concat(" Results")}</h5>
            </div>
          }
          isLoading={data.modalLoading}
          data={data.result}
          columns={resultsColumns}
          highlightedRow={data.result.findIndex((r: Result) => r.party === data.q_party)}
          page={data.index}
          total={data.data.length}
        />
      )}
    </Section>
  );
};

export default ElectionParties;
