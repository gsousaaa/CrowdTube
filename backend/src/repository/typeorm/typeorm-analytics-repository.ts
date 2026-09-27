import type { DataSource } from "typeorm";

import type {
  AnalyticsRepository,
  CreatorAnalyticsData,
} from "../analytics-repository";

type TotalRow = { total_raised_wei: string };
type PeriodSummaryRow = {
  period_raised_wei: string;
  period_donation_count: number | string;
  period_average_donation_wei: string;
};
type TimelineRow = {
  date: string;
  amount_wei: string;
  donation_count: number | string;
};
type CampaignRow = {
  campaign_id: string;
  title: string;
  onchain_campaign_id: string;
  total_raised_wei: string;
  period_raised_wei: string;
  period_donation_count: number | string;
};

export class TypeOrmAnalyticsRepository implements AnalyticsRepository {
  constructor(private readonly dataSource: DataSource) {}

  async getCreatorAnalytics(input: {
    userId: string;
    period: { from: Date; to: Date };
  }): Promise<CreatorAnalyticsData> {
    const parameters = [input.userId, input.period.from, input.period.to];
    const [totalRows, periodRows, timelineRows, campaignRows] = await Promise.all([
      this.dataSource.query(
        `SELECT COALESCE(SUM(donation_event.amount_wei), 0)::text AS total_raised_wei
         FROM notifications notification
         INNER JOIN donation_events donation_event
           ON donation_event.id = notification.donation_event_id
         WHERE notification.user_id = $1
           AND donation_event.status = 'processed'`,
        [input.userId],
      ) as Promise<TotalRow[]>,
      this.dataSource.query(
        `SELECT
           COALESCE(SUM(donation_event.amount_wei), 0)::text AS period_raised_wei,
           COUNT(*)::integer AS period_donation_count,
           COALESCE(TRUNC(AVG(donation_event.amount_wei)), 0)::text
             AS period_average_donation_wei
         FROM notifications notification
         INNER JOIN donation_events donation_event
           ON donation_event.id = notification.donation_event_id
         WHERE notification.user_id = $1
           AND donation_event.status = 'processed'
           AND donation_event.occurred_at >= $2
           AND donation_event.occurred_at < $3`,
        parameters,
      ) as Promise<PeriodSummaryRow[]>,
      this.dataSource.query(
        `WITH daily_donations AS (
           SELECT
             DATE_TRUNC('day', donation_event.occurred_at AT TIME ZONE 'UTC') AS day,
             SUM(donation_event.amount_wei) AS amount_wei,
             COUNT(*)::integer AS donation_count
           FROM notifications notification
           INNER JOIN donation_events donation_event
             ON donation_event.id = notification.donation_event_id
           WHERE notification.user_id = $1
             AND donation_event.status = 'processed'
             AND donation_event.occurred_at >= $2
             AND donation_event.occurred_at < $3
           GROUP BY DATE_TRUNC('day', donation_event.occurred_at AT TIME ZONE 'UTC')
         )
         SELECT
           TO_CHAR(series.day, 'YYYY-MM-DD') AS date,
           COALESCE(daily_donations.amount_wei, 0)::text AS amount_wei,
           COALESCE(daily_donations.donation_count, 0)::integer AS donation_count
         FROM GENERATE_SERIES(
           DATE_TRUNC('day', $2::timestamptz AT TIME ZONE 'UTC'),
           DATE_TRUNC(
             'day',
             ($3::timestamptz - INTERVAL '1 microsecond') AT TIME ZONE 'UTC'
           ),
           INTERVAL '1 day'
         ) AS series(day)
         LEFT JOIN daily_donations ON daily_donations.day = series.day
         ORDER BY series.day`,
        parameters,
      ) as Promise<TimelineRow[]>,
      this.dataSource.query(
        `SELECT
           campaign.id AS campaign_id,
           campaign.title AS title,
           campaign.onchain_campaign_id::text AS onchain_campaign_id,
           SUM(donation_event.amount_wei)::text AS total_raised_wei,
           COALESCE(
             SUM(donation_event.amount_wei) FILTER (
               WHERE donation_event.occurred_at >= $2
                 AND donation_event.occurred_at < $3
             ),
             0
           )::text AS period_raised_wei,
           COUNT(*) FILTER (
             WHERE donation_event.occurred_at >= $2
               AND donation_event.occurred_at < $3
           )::integer AS period_donation_count
         FROM notifications notification
         INNER JOIN donation_events donation_event
           ON donation_event.id = notification.donation_event_id
         INNER JOIN campaigns campaign
           ON campaign.id = notification.campaign_id
         WHERE notification.user_id = $1
           AND donation_event.status = 'processed'
         GROUP BY campaign.id, campaign.title, campaign.onchain_campaign_id
         ORDER BY
           COALESCE(
             SUM(donation_event.amount_wei) FILTER (
               WHERE donation_event.occurred_at >= $2
                 AND donation_event.occurred_at < $3
             ),
             0
           ) DESC,
           SUM(donation_event.amount_wei) DESC`,
        parameters,
      ) as Promise<CampaignRow[]>,
    ]);

    const total = totalRows[0];
    const period = periodRows[0];

    return {
      summary: {
        totalRaisedWei: total?.total_raised_wei ?? "0",
        periodRaisedWei: period?.period_raised_wei ?? "0",
        periodDonationCount: Number(period?.period_donation_count ?? 0),
        periodAverageDonationWei:
          period?.period_average_donation_wei ?? "0",
      },
      timeline: timelineRows.map((row) => ({
        date: row.date,
        amountWei: row.amount_wei,
        donationCount: Number(row.donation_count),
      })),
      campaigns: campaignRows.map((row) => ({
        campaignId: row.campaign_id,
        title: row.title,
        onchainCampaignId: row.onchain_campaign_id,
        totalRaisedWei: row.total_raised_wei,
        periodRaisedWei: row.period_raised_wei,
        periodDonationCount: Number(row.period_donation_count),
      })),
    };
  }
}
