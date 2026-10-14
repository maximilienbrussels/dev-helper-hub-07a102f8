import { Search } from "lucide-react";
import type { Lang } from "@/lib/portal-types";
import { translate } from "@/lib/portal-i18n";
import { MEDIA_CATEGORIES, MEDIA_CATEGORY_LABELS, type MediaCategory } from "@/lib/media.functions";
import type { MediaSort } from "./useMediaLibrary";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Props = {
  lang: Lang;
  search: string;
  onSearch: (v: string) => void;
  category: MediaCategory | "all";
  onCategory: (v: MediaCategory | "all") => void;
  sort: MediaSort;
  onSort: (v: MediaSort) => void;
  count: number;
};

/** Zoeken, filteren op categorie en sorteren — gedeeld door pagina en picker. */
export function MediaToolbar({
  lang,
  search,
  onSearch,
  category,
  onCategory,
  sort,
  onSort,
  count,
}: Props) {
  const t = (k: string) => translate(k, lang);
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-[200px] flex-1">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder={t("media.search")}
          aria-label={t("media.search")}
          className="pl-8"
        />
      </div>
      <Select value={category} onValueChange={(v) => onCategory(v as MediaCategory | "all")}>
        <SelectTrigger className="w-[180px]" aria-label={t("media.category")}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("media.allCategories")}</SelectItem>
          {MEDIA_CATEGORIES.map((c) => (
            <SelectItem key={c} value={c}>
              {MEDIA_CATEGORY_LABELS[c]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={sort} onValueChange={(v) => onSort(v as MediaSort)}>
        <SelectTrigger className="w-[160px]" aria-label="Sort">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="newest">{t("media.sortNewest")}</SelectItem>
          <SelectItem value="oldest">{t("media.sortOldest")}</SelectItem>
          <SelectItem value="name">{t("media.sortName")}</SelectItem>
          <SelectItem value="size">{t("media.sortSize")}</SelectItem>
        </SelectContent>
      </Select>
      <span className="text-xs text-muted-foreground tabular-nums">
        {count} {t("media.count")}
      </span>
    </div>
  );
}
