import React, { useMemo } from "react";
import SkillTreeNodeCard from "./SkillTreeNodeCard.jsx";
import { metaNodes } from "@/skillTree/metaTree.js";
import { getVisibleNodes, getNodeCost, canBuy, getLevel } from "@/skillTree/engine.js";

/**
 * Lightweight Meta Skill Tree Panel
 * Props:
 * - totalLightSparks: number
 * - metaProgress: Record<string, number>
 * - metaStats: { totalSparksSpent: number, achievements: string[] }
 * - onBuyMetaNode: (nodeId: string) => void
 */
const SkillTreePanel = ({
  totalLightSparks,
  metaProgress,
  metaStats,
  onBuyMetaNode,
}) => {
  const ctx = useMemo(
    () => ({
      totalLightSparks,
      totalSparksSpent: metaStats?.totalSparksSpent || 0,
      achievements: metaStats?.achievements || [],
    }),
    [totalLightSparks, metaStats]
  );

  const visible = useMemo(
    () => getVisibleNodes(metaNodes, metaProgress, ctx),
    [metaProgress, ctx]
  );

  return (
    <div className="mt-10">
      <h2 className="text-2xl md:text-3xl font-bold mb-3 text-cyan-400">
        Skill-Tree (Beta)
      </h2>
      <p className="text-sm text-gray-300 mb-4">
        Knoten werden nach und nach enthüllt. Kaufe Vorstufen, gib mehr Funken aus
        oder erreiche Meilensteine, um weitere Zweige freizuschalten.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {visible.map((node) => {
          const level = getLevel(metaProgress, node.id);
          const nextCost = level >= node.maxLevel ? 0 : getNodeCost(node, metaProgress, ctx);
          const check = canBuy(node, metaProgress, ctx);
          const affordable = nextCost <= totalLightSparks;

          return (
            <SkillTreeNodeCard
              key={node.id}
              node={node}
              level={level}
              maxLevel={node.maxLevel}
              cost={nextCost}
              canBuy={check.ok}
              reason={check.reason}
              affordable={check.ok && affordable}
              onBuy={() => onBuyMetaNode(node.id)}
            />
          );
        })}
      </div>
    </div>
  );
};

export default SkillTreePanel;
