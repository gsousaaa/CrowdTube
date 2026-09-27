import { AppError } from "../../errors/app-error";
import type {
  AnalyticsRepository,
  CreatorAnalyticsData,
} from "../../repository/analytics-repository";

const defaultPeriodInMilliseconds = 30 * 24 * 60 * 60 * 1_000;
const maximumPeriodInMilliseconds = 366 * 24 * 60 * 60 * 1_000;

export type CreatorAnalytics = CreatorAnalyticsData & {
  period: {
    from: string;
    to: string;
  };
};

export class GetCreatorAnalyticsUseCase {
  constructor(
    private readonly analytics: AnalyticsRepository,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(input: {
    userId: string;
    from?: Date;
    to?: Date;
  }): Promise<CreatorAnalytics> {
    const to = input.to ?? this.now();
    const from = input.from ?? new Date(to.getTime() - defaultPeriodInMilliseconds);
    const duration = to.getTime() - from.getTime();

    if (duration <= 0) {
      throw new AppError(
        "The analytics start date must be before the end date.",
        400,
        "INVALID_ANALYTICS_PERIOD",
      );
    }
    if (duration > maximumPeriodInMilliseconds) {
      throw new AppError(
        "The analytics period cannot exceed 366 days.",
        400,
        "ANALYTICS_PERIOD_TOO_LARGE",
      );
    }

    const data = await this.analytics.getCreatorAnalytics({
      userId: input.userId,
      period: { from, to },
    });

    return {
      period: {
        from: from.toISOString(),
        to: to.toISOString(),
      },
      ...data,
    };
  }
}
