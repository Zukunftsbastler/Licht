import React from "react";

const Tag = ({ label }) => (
  <span className="px-2 py-0.5 rounded bg-gray-800 text-gray-300 text-xs mr-1 mb-1 inline-block">
    {label}
  </span>
);

const SkillTreeNodeCard = ({
  node,
  level,
  maxLevel,
  cost,
  canBuy,
  reason,
  affordable,
  onBuy,
}) => {
  const isMaxed = level >= maxLevel;
  const locked = !canBuy && !isMaxed;

  return (
    <div className={`bg-gray-900 p-4 rounded border ${locked ? "border-gray-700" : "border-cyan-400"} ${!locked ? "hover:border-yellow-400" : ""} transition-colors`}>
      <div className="flex items-center mb-2">
        <div className="text-2xl mr-2">{node.icon || "🔸"}</div>
        <h3 className="text-lg font-bold text-cyan-400">{node.name}</h3>
      </div>

      <p className="text-sm text-gray-300 mb-3">
        {node.desc}
      </p>

      <div className="mb-3">
        {node.tags?.map((t) => <Tag key={t} label={t} />)}
      </div>

      <div className="flex justify-between items-center text-sm mb-3">
        <div className="text-yellow-400">
          Stufe: {level} / {maxLevel}
        </div>
        {!isMaxed && (
          <div className="text-cyan-300">
            Kosten: {cost}
          </div>
        )}
      </div>

      {isMaxed ? (
        <div className="text-green-400 text-sm font-semibold">Maximale Stufe erreicht</div>
      ) : locked ? (
        <div className="text-red-400 text-xs">{reason || "Gesperrt"}</div>
      ) : (
        <button
          className={`w-full mt-1 px-3 py-2 rounded text-white ${affordable ? "bg-cyan-600 hover:bg-cyan-700" : "bg-gray-600 cursor-not-allowed"}`}
          onClick={onBuy}
          disabled={!affordable}
        >
          Kaufen
        </button>
      )}
    </div>
  );
};

export default SkillTreeNodeCard;
