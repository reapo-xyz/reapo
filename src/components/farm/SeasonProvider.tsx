"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { encodeFunctionData, keccak256, toBytes, type Abi } from "viem";
import { isAddress } from "@/config/brand";
import { CONTRACTS, logLive } from "@/config/contracts";
import { QUESTS, type Quest } from "@/config/seasons";
import { storageKey } from "@/config/storage";
import { useWallet } from "@/components/wallet/WalletProvider";
import { useLocalStore } from "@/components/wallet/useLocalStore";
import { LOG_ABI } from "@/lib/abi";
import { explain, waitForReceipt } from "@/lib/client";
import { checkInPoints, dayIndex, EMPTY_FARMER, levelFor, replay, seasonAt, type FarmerState, type SeasonInfo } from "@/lib/season/clock";
import { evaluate, score, type QuestResult, type Readings } from "@/lib/season/quests";
import { questKey, readWallet, type ChainReadings } from "@/lib/season/read";

/*
 * Shared season state for the HUD, the farm and every panel: the season clock, the wallet being checked
 * (the connected one, or any address pasted in read-only mode), its readings from Base, the quest results,
 * check-ins (ReapoSeasonLog once deployed, this browser otherwise) and the Farmboard history.
 */

type Practice = { days: number[]; stamps: Record<string, { at: number; evidence: string }> };
type HistoryRow = { at: number; block: number; points: number; done: number; season: number };
type StampState = Record<string, { kind: "contract" | "self" | "practice"; tx?: string }>;

type SeasonState = {
  season: SeasonInfo;
  today: number | null;
  /** Address being checked: the connected wallet unless a read-only address is set. */
  subject: string | null;
  readOnly: boolean;
  setWatchAddress: (a: string | null) => void;
  readings: Readings | null;
  results: QuestResult[];
  points: number;
  questPoints: number;
  done: number;
  level: ReturnType<typeof levelFor>;
  farmer: FarmerState;
  checkedInToday: boolean;
  liveMode: boolean;
  loading: boolean;
  error: string | null;
  busy: string | null;
  notice: string | null;
  history: HistoryRow[];
  stamps: StampState;
  refresh: () => Promise<void>;
  checkIn: () => Promise<void>;
  stamp: (q: Quest) => Promise<void>;
  clearNotice: () => void;
};

const Ctx = createContext<SeasonState | null>(null);
const now = () => Math.floor(Date.now() / 1000);

export function SeasonProvider({ children }: { children: React.ReactNode }) {
  const { address, sendTransaction, onChain, switchNetwork } = useWallet();
  const [clock, setClock] = useState(() => now());
  useEffect(() => {
    const t = window.setInterval(() => setClock(now()), 30_000);
    return () => window.clearInterval(t);
  }, []);
  const season = useMemo(() => seasonAt(clock), [clock]);
  const today = dayIndex(clock);

  const [watch, setWatch] = useLocalStore<string | null>(storageKey("watch"), null);
  const subject = watch && isAddress(watch) ? watch : address;
  const readOnly = !!subject && (!address || subject.toLowerCase() !== address.toLowerCase());
  const key = (subject ?? "none").toLowerCase();

  const [practice, setPractice] = useLocalStore<Practice>(storageKey("practice", key), { days: [], stamps: {} });
  const [history, setHistory] = useLocalStore<HistoryRow[]>(storageKey("history", key), []);
  const [chain, setChain] = useState<ChainReadings | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [stamps, setStamps] = useState<StampState>({});

  const liveMode = logLive();
  const practiceFarmer = useMemo(() => replay(practice.days).get(season.index) ?? EMPTY_FARMER, [practice.days, season.index]);
  const farmer = liveMode ? (chain?.chainFarmer ?? EMPTY_FARMER) : practiceFarmer;
  const checkedInToday = today !== null && farmer.checkIns > 0 && farmer.lastDay === today;

  const readings: Readings | null = useMemo(
    () => (chain && subject && chain.address.toLowerCase() === subject.toLowerCase() ? { ...chain, farmer, today, checkInSource: liveMode ? "contract" : "practice" } : null),
    [chain, subject, farmer, today, liveMode],
  );
  const results = useMemo(() => (readings ? QUESTS.map((q) => evaluate(q, readings)) : QUESTS.map(() => ({ status: "unknown" as const, input: "not checked yet" }))), [readings]);
  const s = score(QUESTS, results);
  const points = s.points + checkInPoints(farmer.checkIns);
  const level = levelFor(points);

  const refresh = useCallback(async () => {
    if (!subject) return;
    setLoading(true);
    setError(null);
    try {
      const r = await readWallet(subject, season.index);
      setChain(r);
    } catch (e) {
      setError(explain(e));
    } finally {
      setLoading(false);
    }
  }, [subject, season.index]);

  // Read when the subject changes, then every 90 s while the tab is visible.
  useEffect(() => {
    if (!subject) return;
    const first = window.setTimeout(() => void refresh(), 0);
    const t = window.setInterval(() => document.visibilityState === "visible" && void refresh(), 90_000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(t);
    };
  }, [subject, refresh]);

  // One history row per new reading (Farmboard), capped at 40 rows.
  useEffect(() => {
    if (!readings) return;
    const last = history[0];
    if (last && last.block === readings.block) return;
    if (last && last.points === points && last.done === s.done && Date.now() - last.at < 6 * 3600_000) return;
    setHistory([{ at: Date.now(), block: readings.block, points, done: s.done, season: season.index }, ...history].slice(0, 40));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readings?.block, points]);

  const send = useCallback(
    async (label: string, data: `0x${string}`) => {
      if (!onChain) await switchNetwork();
      const hash = await sendTransaction({ to: CONTRACTS.log, data });
      setNotice(`${label}: sent, waiting for Base to include it…`);
      const r = await waitForReceipt(hash);
      if (!r.ok) throw new Error(`${label} reverted on chain.`);
      setNotice(`${label}: confirmed in block ${r.blockNumber.toLocaleString("en-US")}.`);
      return hash;
    },
    [onChain, sendTransaction, switchNetwork],
  );

  const checkIn = useCallback(async () => {
    if (today === null) {
      setNotice("The season clock has not started yet.");
      return;
    }
    if (checkedInToday) {
      setNotice("Already checked in today. The next UTC day starts at 00:00 UTC.");
      return;
    }
    setBusy("checkin");
    try {
      if (liveMode) {
        if (!address || readOnly) throw new Error("Connect the wallet you want to check in with.");
        await send("Check-in", encodeFunctionData({ abi: LOG_ABI as Abi, functionName: "checkIn", args: [] }));
        await refresh();
      } else {
        if (!subject) throw new Error("Connect a wallet (or paste an address) to keep practice check-ins for it.");
        setPractice({ ...practice, days: [...practice.days, today] });
        setNotice("Practice check-in kept in this browser. Nothing was sent to Base.");
      }
    } catch (e) {
      setNotice(explain(e));
    } finally {
      setBusy(null);
    }
  }, [today, checkedInToday, liveMode, address, readOnly, send, refresh, subject, practice, setPractice]);

  const stamp = useCallback(
    async (q: Quest) => {
      const i = QUESTS.indexOf(q);
      if (results[i]?.status !== "done" || !readings) {
        setNotice("Clear the quest first: the stamp is only offered for a quest the board shows as done.");
        return;
      }
      setBusy(`stamp:${q.id}`);
      try {
        const evidence = keccak256(toBytes(JSON.stringify({ quest: q.id, wallet: readings.address.toLowerCase(), block: readings.block, input: results[i].input })));
        if (liveMode) {
          if (!address || readOnly) throw new Error("Connect the wallet the quest belongs to.");
          let hash: string;
          if (q.kind.type === "streak") {
            hash = await send(`Stamp "${q.title}"`, encodeFunctionData({ abi: LOG_ABI as Abi, functionName: "stampStreak", args: [q.kind.days] }));
            setStamps((m) => ({ ...m, [q.id]: { kind: "contract", tx: hash } }));
          } else {
            const questId = questKey(q.id);
            hash = await send(`Stamp "${q.title}"`, encodeFunctionData({ abi: LOG_ABI as Abi, functionName: "stampSelfClaimed", args: [questId, evidence] }));
            setStamps((m) => ({ ...m, [q.id]: { kind: "self", tx: hash } }));
          }
        } else {
          setPractice({ ...practice, stamps: { ...practice.stamps, [q.id]: { at: Date.now(), evidence } } });
          setNotice(`Practice stamp for "${q.title}" kept in this browser. Nothing was sent to Base.`);
        }
      } catch (e) {
        setNotice(explain(e));
      } finally {
        setBusy(null);
      }
    },
    [results, readings, liveMode, address, readOnly, send, practice, setPractice],
  );

  const allStamps: StampState = useMemo(() => {
    const out: StampState = {};
    for (const [id, kind] of Object.entries(chain?.chainStamps ?? {})) out[id] = { kind };
    Object.assign(out, stamps);
    if (!liveMode) for (const id of Object.keys(practice.stamps)) out[id] = { kind: "practice" };
    return out;
  }, [stamps, practice.stamps, liveMode, chain?.chainStamps]);

  const value: SeasonState = {
    season,
    today,
    subject,
    readOnly,
    setWatchAddress: (a) => setWatch(a && isAddress(a) ? a : null),
    readings,
    results,
    points,
    questPoints: s.points,
    done: s.done,
    level,
    farmer,
    checkedInToday,
    liveMode,
    loading,
    error,
    busy,
    notice,
    history,
    stamps: allStamps,
    refresh,
    checkIn,
    stamp,
    clearNotice: () => setNotice(null),
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSeason() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useSeason must be used inside SeasonProvider");
  return c;
}
