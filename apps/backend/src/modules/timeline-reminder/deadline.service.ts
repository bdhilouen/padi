import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ServiceNameEnum, StatusEnum } from '../../common/enums/index.js';
import type { DeadlineDto, DeadlineListDto } from './dto/deadline.dto.js';
import type {
  DeadlineSort,
  ListDeadlinesQueryDto,
} from './dto/list-deadlines-query.dto.js';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;

type SortDirection = 'ASC' | 'DESC';

interface DeadlineViewRow {
  id: string;
  service_name: ServiceNameEnum;
  title: string;
  description: string | null;
  due_date: string;
  status: StatusEnum;
  created_at: Date;
  updated_at: Date;
}

interface CountRow {
  total: string;
}

interface SortConfig {
  column: string;
  direction: SortDirection;
}

@Injectable()
export class DeadlineService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async listDeadlines(
    userId: string,
    query: ListDeadlinesQueryDto,
  ): Promise<DeadlineListDto> {
    const page = query.page ?? DEFAULT_PAGE;
    const limit = query.limit ?? DEFAULT_LIMIT;
    const offset = (page - 1) * limit;

    const { whereSql, params } = this.buildWhereClause(userId, query);
    const sort = this.parseSort(query.sort);

    const countRows = await this.dataSource.query<CountRow[]>(
      `SELECT COUNT(*)::text AS total
       FROM deadlines_with_status
       WHERE ${whereSql}`,
      params,
    );

    const total = Number(countRows[0]?.total ?? 0);

    const rows = await this.dataSource.query<DeadlineViewRow[]>(
      `SELECT
         id,
         service_name,
         title,
         description,
         due_date,
         status,
         created_at,
         updated_at
       FROM deadlines_with_status
       WHERE ${whereSql}
       ORDER BY ${sort.column} ${sort.direction}, id ASC
       LIMIT $${params.length + 1}
       OFFSET $${params.length + 2}`,
      [...params, limit, offset],
    );

    return {
      data: rows.map((row) => this.toDto(row)),
      meta: { total, page, limit },
    };
  }

  async getDeadline(userId: string, deadlineId: string): Promise<DeadlineDto> {
    const rows = await this.dataSource.query<DeadlineViewRow[]>(
      `SELECT
         id,
         service_name,
         title,
         description,
         due_date,
         status,
         created_at,
         updated_at
       FROM deadlines_with_status
       WHERE user_id = $1 AND id = $2
       LIMIT 1`,
      [userId, deadlineId],
    );

    const row = rows[0];
    if (!row) {
      throw new NotFoundException('Deadline not found');
    }

    return this.toDto(row);
  }

  private buildWhereClause(
    userId: string,
    query: ListDeadlinesQueryDto,
  ): { whereSql: string; params: Array<string> } {
    const clauses = ['user_id = $1'];
    const params = [userId];

    if (query.status) {
      params.push(query.status);
      clauses.push(`status = $${params.length}`);
    }

    if (query.service_name) {
      params.push(query.service_name);
      clauses.push(`service_name = $${params.length}`);
    }

    if (query.due_date_from) {
      params.push(query.due_date_from);
      clauses.push(`due_date >= $${params.length}`);
    }

    if (query.due_date_to) {
      params.push(query.due_date_to);
      clauses.push(`due_date <= $${params.length}`);
    }

    return {
      whereSql: clauses.join(' AND '),
      params,
    };
  }

  private parseSort(sort: DeadlineSort | undefined): SortConfig {
    if (!sort) {
      return { column: 'due_date', direction: 'ASC' };
    }

    const isDescending = sort.startsWith('-');
    const field = isDescending ? sort.slice(1) : sort;

    return {
      column: this.toSortColumn(field),
      direction: isDescending ? 'DESC' : 'ASC',
    };
  }

  private toSortColumn(field: string): string {
    switch (field) {
      case 'due_date':
        return 'due_date';
      case 'created_at':
        return 'created_at';
      case 'service_name':
        return 'service_name';
      case 'status':
        return 'status';
      case 'title':
        return 'title';
      default:
        return 'due_date';
    }
  }

  private toDto(row: DeadlineViewRow): DeadlineDto {
    return {
      id: row.id,
      service_name: row.service_name,
      title: row.title,
      description: row.description,
      due_date: row.due_date,
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }
}
