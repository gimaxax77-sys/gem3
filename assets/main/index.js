System.register("chunks:///_virtual/admin.ts", ['cc', './balance.ts', './difficulty.ts'], function (exports) {
  var cclegacy, BALANCE, DIFFICULTIES;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      BALANCE = module.BALANCE;
    }, function (module) {
      DIFFICULTIES = module.DIFFICULTIES;
    }],
    execute: function () {
      exports({
        adjustField: adjustField,
        applyOverrides: applyOverrides,
        getBalanceValue: getBalanceValue,
        resetAll: resetAll,
        setBalanceValue: setBalanceValue
      });
      cclegacy._RF.push({}, "d67faIivSFGqqPUvgG50Dw5", "admin", undefined);

      // ─────────────────────────────────────────────────────────────
      // 운영자 조작 — 밸런스 배수/배율을 라이브로 튜닝하고 세이브에 지속.
      //   · ADMIN_FIELDS: 조정 가능한 항목(경로+조작 방식) 스키마.
      //   · setBalanceValue: BALANCE(모듈 전역)를 즉시 변경 → 전 시스템 반영.
      //   · applyOverrides: 세이브의 오버라이드를 부팅 시 재적용.
      //   · DEFAULTS: 최초값 스냅샷 → 리셋 지원.
      // ─────────────────────────────────────────────────────────────

      // 조정 대상. factor=배수 조작(×/÷), step=가감 조작(+/−).
      var ADMIN_FIELDS = exports('ADMIN_FIELDS', [{
        path: 'enemyGrowth',
        label: '적 강화율 / 층',
        step: 0.005,
        min: 1.0,
        fmt: function fmt(v) {
          return v.toFixed(3);
        }
      }, {
        path: 'rewardGrowth',
        label: '보상 증가율 / 층',
        step: 0.005,
        min: 1.0,
        fmt: function fmt(v) {
          return v.toFixed(3);
        }
      }, {
        path: 'enemyBase.hp',
        label: '적 기본 HP',
        factor: 1.1,
        fmt: function fmt(v) {
          return Math.round(v);
        }
      }, {
        path: 'enemyBase.atk',
        label: '적 기본 ATK',
        factor: 1.1,
        fmt: function fmt(v) {
          return Math.round(v);
        }
      }, {
        path: 'rewardBase.currency',
        label: '기본 골드 보상',
        factor: 1.1,
        fmt: function fmt(v) {
          return Math.round(v);
        }
      }, {
        path: 'rewardBase.growth',
        label: '기본 정수 보상',
        factor: 1.1,
        fmt: function fmt(v) {
          return Math.round(v);
        }
      }, {
        path: 'statPerLevel',
        label: '레벨당 스탯 %',
        step: 0.01,
        min: 0,
        fmt: function fmt(v) {
          return (v * 100).toFixed(0) + '%';
        }
      }, {
        path: 'statPerRank',
        label: '랭크당 스탯 %',
        step: 0.05,
        min: 0,
        fmt: function fmt(v) {
          return (v * 100).toFixed(0) + '%';
        }
      }, {
        path: 'prestigePowerBonus',
        label: '환생 파워 / pt',
        step: 0.02,
        min: 0,
        fmt: function fmt(v) {
          return (v * 100).toFixed(0) + '%';
        }
      },
      // 전투력 가중치 (스탯이 전투력에 기여하는 비율)
      {
        path: 'powerWeights.hp',
        label: '전투력: 체력 계수',
        step: 0.01,
        min: 0,
        fmt: function fmt(v) {
          return v.toFixed(2);
        }
      }, {
        path: 'powerWeights.atk',
        label: '전투력: 공격 계수',
        step: 0.05,
        min: 0,
        fmt: function fmt(v) {
          return v.toFixed(2);
        }
      }, {
        path: 'powerWeights.def',
        label: '전투력: 방어 계수',
        step: 0.05,
        min: 0,
        fmt: function fmt(v) {
          return v.toFixed(2);
        }
      }, {
        path: 'powerWeights.spd',
        label: '전투력: 속도 계수',
        step: 0.05,
        min: 0,
        fmt: function fmt(v) {
          return v.toFixed(2);
        }
      }, {
        path: 'prestigeIncomeBonus',
        label: '환생 수입 / pt',
        step: 0.05,
        min: 0,
        fmt: function fmt(v) {
          return (v * 100).toFixed(0) + '%';
        }
      },
      // 난이도 보상 배수 (difficulty 배열 직접 조정)
      {
        path: 'DIFF.hard.rewardMult',
        label: '험난 보상 배수',
        factor: 1.15,
        fmt: function fmt(v) {
          return '×' + Math.round(v);
        }
      }, {
        path: 'DIFF.hell.rewardMult',
        label: '지옥 보상 배수',
        factor: 1.15,
        fmt: function fmt(v) {
          return '×' + Math.round(v);
        }
      }, {
        path: 'DIFF.abyss.rewardMult',
        label: '나락 보상 배수',
        factor: 1.15,
        fmt: function fmt(v) {
          return '×' + Math.round(v);
        }
      }]);

      // 경로 → [객체, 키]. 'DIFF.<id>.<field>'는 DIFFICULTIES를, 그 외는 BALANCE를 가리킨다.
      function ref(path) {
        if (path.startsWith('DIFF.')) {
          var _path$split = path.split('.'),
            id = _path$split[1],
            field = _path$split[2];
          var d = DIFFICULTIES.find(function (x) {
            return x.id === id;
          });
          return [d, field];
        }
        var parts = path.split('.');
        var o = BALANCE;
        for (var i = 0; i < parts.length - 1; i++) o = o[parts[i]];
        return [o, parts[parts.length - 1]];
      }
      function getBalanceValue(path) {
        var _ref = ref(path),
          o = _ref[0],
          k = _ref[1];
        return o ? o[k] : undefined;
      }
      function setBalanceValue(path, val) {
        var _ref2 = ref(path),
          o = _ref2[0],
          k = _ref2[1];
        if (o) o[k] = val;
      }

      // 최초값 스냅샷 (리셋용) — 모듈 로드 시 1회 캡처.
      var DEFAULTS = exports('DEFAULTS', Object.fromEntries(ADMIN_FIELDS.map(function (f) {
        return [f.path, getBalanceValue(f.path)];
      })));

      // 필드 한 개를 방향(+1/−1)만큼 조정하고 새 값을 반환.
      function adjustField(field, dir) {
        var cur = getBalanceValue(field.path);
        var next = field.factor ? dir > 0 ? cur * field.factor : cur / field.factor : cur + dir * field.step;
        if (field.min !== undefined) next = Math.max(field.min, next);
        next = Math.round(next * 1e6) / 1e6;
        setBalanceValue(field.path, next);
        return next;
      }

      // 세이브 오버라이드({path:val})를 BALANCE/DIFFICULTIES에 재적용 (부팅 시).
      function applyOverrides(overrides) {
        if (!overrides) return;
        var _loop = function _loop() {
          var _Object$entries$_i = _Object$entries[_i],
            path = _Object$entries$_i[0],
            val = _Object$entries$_i[1];
          if (ADMIN_FIELDS.some(function (f) {
            return f.path === path;
          })) setBalanceValue(path, val);
        };
        for (var _i = 0, _Object$entries = Object.entries(overrides); _i < _Object$entries.length; _i++) {
          _loop();
        }
      }

      // 전체 초기화 → 최초값 복원.
      function resetAll() {
        for (var _i2 = 0, _Object$entries2 = Object.entries(DEFAULTS); _i2 < _Object$entries2.length; _i2++) {
          var _Object$entries2$_i = _Object$entries2[_i2],
            path = _Object$entries2$_i[0],
            val = _Object$entries2$_i[1];
          setBalanceValue(path, val);
        }
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/archetypes.ts", ['cc'], function (exports) {
  var cclegacy;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }],
    execute: function () {
      exports('getArchetype', getArchetype);
      cclegacy._RF.push({}, "67e09Zhmg9NVYYaVAcBEzgF", "archetypes", undefined);
      // ─────────────────────────────────────────────────────────────
      // 유닛 원형(Archetype) — 시스템 레벨의 "역할" 정의.
      // 컨셉(판타지/SF)과 무관하게 시스템은 오직 이 역할 ID만 안다.
      // 컨셉 레이어가 나중에 ID를 표시 이름으로 바꿔준다.
      //   VANGUARD(방어형) · STRIKER(공격형) · SUPPORT(지원형)
      //   ROGUE(도적형) · ARCHER(궁수형) · MAGE(법사형) — 세부 딜러 분화
      // ─────────────────────────────────────────────────────────────

      var ARCHETYPES = exports('ARCHETYPES', {
        VANGUARD: {
          id: 'VANGUARD',
          role: '방어',
          roleLabel: '방어형',
          trait: '높은 체력·방어로 전열을 지키는 수호자',
          base: {
            hp: 1200,
            atk: 60,
            def: 80,
            spd: 90
          },
          // 지원형이 아니므로 팀 버프 없음
          teamBuff: null
        },
        STRIKER: {
          id: 'STRIKER',
          role: '공격',
          roleLabel: '공격형',
          trait: '높은 공격력·속도로 적을 제압하는 딜러',
          base: {
            hp: 600,
            atk: 150,
            def: 30,
            spd: 130
          },
          teamBuff: null
        },
        SUPPORT: {
          id: 'SUPPORT',
          role: '지원',
          roleLabel: '지원형',
          trait: '팀 전체 공격력을 끌어올리는 지원가',
          base: {
            hp: 700,
            atk: 50,
            def: 40,
            spd: 110
          },
          // 팀 전체 공격력 +15% (지원형의 시스템적 정체성)
          teamBuff: {
            stat: 'atk',
            mult: 0.15
          }
        },
        ROGUE: {
          id: 'ROGUE',
          role: '공격',
          roleLabel: '도적형',
          trait: '빠른 속도로 급습해 빈틈을 파고드는 근접 딜러',
          // STRIKER보다 더 빠르고 더 약함(글래스캐논) — 근접 딜러 축의 변주.
          base: {
            hp: 550,
            atk: 145,
            def: 25,
            spd: 150
          },
          teamBuff: null
        },
        ARCHER: {
          id: 'ARCHER',
          role: '공격',
          roleLabel: '궁수형',
          trait: '원거리에서 정밀 사격하는 딜러',
          // STRIKER보다 체력·방어는 조금 낫지만 공격은 낮은 균형형 원거리 딜러.
          base: {
            hp: 620,
            atk: 125,
            def: 35,
            spd: 125
          },
          teamBuff: null
        },
        MAGE: {
          id: 'MAGE',
          role: '공격',
          roleLabel: '법사형',
          trait: '강력한 주문으로 폭발적 피해를 주는 캐스터',
          // 전 원형 중 공격 최고·생존 최저인 극단적 글래스캐논.
          base: {
            hp: 500,
            atk: 165,
            def: 20,
            spd: 95
          },
          teamBuff: null
        }
      });
      function getArchetype(id) {
        var a = ARCHETYPES[id];
        if (!a) throw new Error("\uC54C \uC218 \uC5C6\uB294 \uC6D0\uD615: " + id);
        return a;
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/arena.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './stats.ts', './balance.ts', './progression.ts', './economy.ts', './mailbox.ts'], function (exports) {
  var _extends, _createForOfIteratorHelperLoose, cclegacy, computePower, accountMods, getStage, earn, addMail;
  return {
    setters: [function (module) {
      _extends = module.extends;
      _createForOfIteratorHelperLoose = module.createForOfIteratorHelperLoose;
    }, function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      computePower = module.computePower;
    }, function (module) {
      accountMods = module.accountMods;
    }, function (module) {
      getStage = module.getStage;
    }, function (module) {
      earn = module.earn;
    }, function (module) {
      addMail = module.addMail;
    }],
    execute: function () {
      exports({
        arenaEntriesLeft: arenaEntriesLeft,
        arenaFight: arenaFight,
        arenaInfo: arenaInfo,
        arenaPowerTier: arenaPowerTier,
        ladderInfo: ladderInfo,
        ladderPeriod: ladderPeriod,
        ladderSettleReward: ladderSettleReward,
        partyPowerEff: partyPowerEff,
        pickOpponent: pickOpponent,
        recordLadderWin: recordLadderWin,
        refreshLadders: refreshLadders
      });
      cclegacy._RF.push({}, "46b75TNfjFAQJvpNrCctXGH", "arena", undefined);

      // ─────────────────────────────────────────────────────────────
      // 아레나 — 전투력(파워) 기반 리그. 비동기 경쟁(랭크전).
      //   · 리그(티어)를 "전투력"으로 나눠, 초보/약자가 고전투력 강자와 붙지 않게 한다.
      //   · 매칭은 같은 리그 안에서, 내 전투력 대비 "공정 밴드"로 상대를 생성한다.
      //     (약자 보호: 상대 전투력은 내 전투력의 1.12배를 절대 넘지 않는다.)
      //   · 승패로 랭크 포인트가 오르내리고, 상위 리그일수록 보상이 크다.
      // ─────────────────────────────────────────────────────────────

      var ARENA_ENTRIES = exports('ARENA_ENTRIES', 5);

      // 전투력 리그 — min은 진입 전투력 하한. 상대는 같은 리그 안에서만 매칭된다.
      var ARENA_POWER_TIERS = exports('ARENA_POWER_TIERS', [{
        min: 0,
        name: '브론즈',
        emoji: '🥉'
      }, {
        min: 3000,
        name: '실버',
        emoji: '🥈'
      }, {
        min: 12000,
        name: '골드',
        emoji: '🥇'
      }, {
        min: 40000,
        name: '플래티넘',
        emoji: '💠'
      }, {
        min: 120000,
        name: '다이아',
        emoji: '💎'
      }, {
        min: 350000,
        name: '마스터',
        emoji: '👑'
      }, {
        min: 1000000,
        name: '그랜드마스터',
        emoji: '🔱'
      }]);

      // 약자 보호 상수: 상대 전투력 상한 배수(내 전투력의 몇 배까지 허용하나).
      var OPP_CAP_MULT = 1.12;

      // ── 3중 리그(주간/격주/월간) ──────────────────────────────────
      // 한 번의 PvP 승리가 세 리그 포인트에 동시 적립되고, 각 리그는 자기 주기로
      // 독립 리셋·정산(순위 보상은 우편함으로). 서버 연동 전에는 포인트 마일스톤 정산.
      var ARENA_LADDERS = exports('ARENA_LADDERS', [{
        id: 'weekly',
        label: '주간',
        days: 7,
        weight: 1
      }, {
        id: 'biweekly',
        label: '격주',
        days: 14,
        weight: 2.2
      }, {
        id: 'monthly',
        label: '월간',
        days: 28,
        weight: 5
      }]);
      var DAY_MS = 86400000;
      function ladderPeriod(now, days) {
        return Math.floor(now / (days * DAY_MS));
      }
      // 정산 보상(로컬 폴백): 누적 포인트 마일스톤 × 리그 가중치. 서버 연동 시 실 순위 보상으로 대체.
      function ladderSettleReward(ladderId, points) {
        if (points <= 0) return null;
        var l = ARENA_LADDERS.find(function (x) {
          return x.id === ladderId;
        });
        var w = l ? l.weight : 1;
        var gem = Math.max(5, Math.min(3000, Math.round(points / 25 * w)));
        return {
          gem: gem
        };
      }

      // 순수 매칭: 후보 목록에서 "같은 리그 + 약자보호 밴드(내 파워 0.7~1.12배)" 상대 선택.
      // candidates: [{ power, ... }]. 클라(봇 풀)·서버(실 유저 풀) 공용.
      function pickOpponent(myPower, candidates, rng) {
        if (rng === void 0) {
          rng = Math.random;
        }
        var tier = arenaPowerTier(myPower);
        var lo = Math.max(myPower * 0.7, tier.min);
        var hi = Math.min(myPower * OPP_CAP_MULT, tier.max - 1);
        var pool = (candidates || []).filter(function (c) {
          return c && c.power >= lo && c.power <= hi;
        });
        if (!pool.length) return null;
        return pool[Math.floor(rng() * pool.length)];
      }
      function ensureLadders(state) {
        state.ladders = state.ladders || {};
        for (var _iterator = _createForOfIteratorHelperLoose(ARENA_LADDERS), _step; !(_step = _iterator()).done;) {
          var l = _step.value;
          state.ladders[l.id] = state.ladders[l.id] || {
            points: 0,
            period: null
          };
        }
        return state.ladders;
      }
      // 주기 경과 시 정산(우편) + 리셋. 최초 진입은 period만 세팅.
      function refreshLadders(state, now) {
        if (now === void 0) {
          now = Date.now();
        }
        var L = ensureLadders(state);
        for (var _iterator2 = _createForOfIteratorHelperLoose(ARENA_LADDERS), _step2; !(_step2 = _iterator2()).done;) {
          var l = _step2.value;
          var cur = ladderPeriod(now, l.days);
          var st = L[l.id];
          if (st.period === null) {
            st.period = cur;
            continue;
          }
          if (st.period !== cur) {
            var reward = ladderSettleReward(l.id, st.points);
            if (reward) addMail(state, {
              title: l.label + " \uB9AC\uADF8 \uC815\uC0B0 \uBCF4\uC0C1",
              reward: reward,
              ts: now
            });
            st.points = 0;
            st.period = cur;
          }
        }
      }
      // 승리 포인트를 세 리그에 동시 적립.
      function recordLadderWin(state, points, now) {
        if (now === void 0) {
          now = Date.now();
        }
        refreshLadders(state, now);
        var L = ensureLadders(state);
        for (var _iterator3 = _createForOfIteratorHelperLoose(ARENA_LADDERS), _step3; !(_step3 = _iterator3()).done;) {
          var l = _step3.value;
          L[l.id].points += points;
        }
      }
      // UI용 현황: 리그별 포인트 + 남은 시간.
      function ladderInfo(state, now) {
        if (now === void 0) {
          now = Date.now();
        }
        refreshLadders(state, now);
        var L = ensureLadders(state);
        return ARENA_LADDERS.map(function (l) {
          var cur = ladderPeriod(now, l.days);
          var endsAt = (cur + 1) * l.days * DAY_MS;
          return {
            id: l.id,
            label: l.label,
            points: L[l.id].points,
            endsInMs: Math.max(0, endsAt - now)
          };
        });
      }

      // 전투력 → 리그(인덱스·이름·이모지·구간 [min,max)).
      function arenaPowerTier(power) {
        var idx = 0;
        for (var i = 0; i < ARENA_POWER_TIERS.length; i++) {
          if (power >= ARENA_POWER_TIERS[i].min) idx = i;else break;
        }
        var t = ARENA_POWER_TIERS[idx];
        var max = idx + 1 < ARENA_POWER_TIERS.length ? ARENA_POWER_TIERS[idx + 1].min : Infinity;
        return _extends({}, t, {
          index: idx,
          max: max
        });
      }

      // 내 파티 실효 전투력(계정 배수 포함).
      function partyPowerEff(state) {
        var byId = new Map(state.units.map(function (u) {
          return [u.uid, u];
        }));
        var party = state.party.map(function (id) {
          return byId.get(id);
        }).filter(Boolean);
        var mult = accountMods(state).powerMult;
        return party.reduce(function (s, u) {
          return s + computePower(u);
        }, 0) * mult;
      }

      // UI용 현황(대전 없이 조회): 내 전투력·리그·랭크 포인트.
      function arenaInfo(state) {
        var power = partyPowerEff(state);
        return {
          power: Math.round(power),
          tier: arenaPowerTier(power),
          points: state.arena.points
        };
      }
      function refresh(state, now) {
        var d = Math.floor(now / 86400000);
        if (state.arena.day !== d) {
          state.arena.day = d;
          state.arena.entries = 0;
        }
      }
      function arenaEntriesLeft(state, now) {
        if (now === void 0) {
          now = Date.now();
        }
        refresh(state, now);
        return ARENA_ENTRIES - state.arena.entries;
      }

      // 한 판 대전. 상대는 "같은 리그 + 공정 밴드"로 생성하며, 내 전투력의 1.12배를 넘지 않는다.
      function arenaFight(state, rng, now) {
        if (rng === void 0) {
          rng = Math.random;
        }
        if (now === void 0) {
          now = Date.now();
        }
        if (arenaEntriesLeft(state, now) <= 0) return {
          ok: false,
          reason: '오늘 입장 소진'
        };
        state.arena.entries += 1;
        var my = partyPowerEff(state);
        var tier = arenaPowerTier(my);
        // 공정 밴드 0.80~1.12 → 약자 보호 상한(my×1.12)과 리그 상한 이내로 클램프.
        var band = 0.80 + rng() * 0.32;
        var opp = my * band;
        opp = Math.min(opp, my * OPP_CAP_MULT, tier.max - 1);
        opp = Math.max(opp, my * 0.70, tier.min);
        var win = my >= opp;
        var gain = win ? 25 : -12;
        state.arena.points = Math.max(0, state.arena.points + gain);
        // 3중 리그: 승리 시 세 리그에 포인트 동시 적립(단방향 — 패배는 리그 무손실).
        if (win) recordLadderWin(state, gain, now);else refreshLadders(state, now);

        // 상위 리그일수록 보상↑.
        var reward = win ? {
          gem: 5 + tier.index * 2,
          currency: Math.round(getStage(state.peakStage).rewards.currency * 20 * (1 + tier.index * 0.5))
        } : {};
        if (win) earn(state.wallet, reward);
        return {
          ok: true,
          win: win,
          points: state.arena.points,
          tier: tier.name,
          tierEmoji: tier.emoji,
          tierIndex: tier.index,
          reward: reward,
          myPower: Math.round(my),
          oppPower: Math.round(opp),
          gain: gain
        };
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/balance.ts", ['cc', './relics.ts', './pets.ts', './rentals.ts', './summonMastery.ts', './emblems.ts', './guardians.ts'], function (exports) {
  var cclegacy, relicMods, petMods, rentalMods, summonMasteryPower, emblemMods, guardianMods;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      relicMods = module.relicMods;
    }, function (module) {
      petMods = module.petMods;
    }, function (module) {
      rentalMods = module.rentalMods;
    }, function (module) {
      summonMasteryPower = module.summonMasteryPower;
    }, function (module) {
      emblemMods = module.emblemMods;
    }, function (module) {
      guardianMods = module.guardianMods;
    }],
    execute: function () {
      exports('accountMods', accountMods);
      cclegacy._RF.push({}, "04aaakXoLJM3avtFtGr+S6L", "balance", undefined);
      // ─────────────────────────────────────────────────────────────
      // 밸런스 상수 단일 소스 — 게임의 "숫자 감각"이 전부 여기 모인다.
      // progression/stats/units/enhance/gear 가 모두 이 값을 참조한다.
      // 밸런스 시뮬레이터가 이 값을 바꿔가며 성장 곡선을 실험한다.
      // (기본값을 바꾸지 않는 한 게임 동작은 그대로다.)
      //
      // 값을 평면(flat)으로 두어 오버라이드/스냅샷이 단순하도록 했다.
      // ─────────────────────────────────────────────────────────────

      var BALANCE = exports('BALANCE', {
        // 적 스탯 (스테이지 곡선) — base를 30% 낮춰 전 층 요구치를 즉시 하향.
        enemyBase: {
          hp: 630,
          atk: 49,
          def: 30
        },
        // 적 강화율(1.11) < 보상 증가율(1.14) → 수입이 난이도를 앞질러 벽을 완만하게.
        // base 하향 + 강화율 완화가 겹쳐 층이 깊을수록 요구 전투력이 크게 낮아진다.
        // 남는 벽은 "성장 비용의 지수화"라 환생(파워 배수)이 자연스레 이를 넘는다.
        enemyGrowth: 1.11,
        // 스테이지당 적 강화율 (허들 추가 완화)

        // 스테이지 보상 (수입 곡선) — base 30% 상향 + 증가율 난이도보다 빠르게.
        rewardBase: {
          currency: 31,
          growth: 13
        },
        rewardGrowth: 1.14,
        // 스테이지당 보상 증가율

        // 유닛 성장 (스탯 곡선)
        statPerLevel: 0.08,
        // 레벨당 스탯 +8%
        statPerRank: 0.25,
        // 랭크당 스탯 +25%
        spdPerLevel: 0.01,
        // 레벨당 속도 +1%

        // 전투력 지표 가중치 — "각 스탯이 전투력 1점에 얼마나 기여하는가"의 단일 소스.
        //   전투력 = Σ(스탯 × powerWeights) + Σ(전투효과 × powerEffectWeights)
        // 기존 하드코딩(0.15/1.2/0.6/1.0)을 그대로 옮겨 기본 동작은 동일.
        // hp 0.15→0.09: 방어형(VANGUARD)의 막대한 HP가 전투력 지표를 지배해
        //   저등급 탱커가 고등급 딜러(STRIKER)를 앞지르던 역전을 제거(원형 간 형평).
        //   ※ 전투 판정(resolution)은 원시 스탯을 쓰므로 승패엔 영향 없음 — 표시 지표만 교정.
        powerWeights: {
          hp: 0.09,
          atk: 1.2,
          def: 0.6,
          spd: 1.0
        },
        // 전투 효과(치명·흡혈·관통·피해감소=회피성)를 전투력에 환산.
        //   값은 "효과 1.0(=100%)당 전투력 기여". 실제 효과는 소수(0.1~0.5)이므로
        //   lifesteal 0.15 → 900×0.15 = +135 전투력 식으로 반영된다.
        //   계수는 resolution.mjs의 실제 전투 기여에 맞춰 산정(감이 아니라 공식 기반):
        //   · lifesteal(900)/dmgReduce(1000): 순수 생존(유효 HP)축 → 포인트당 최고.
        //       dmgReduce는 감쇠 1/(1-r)가 가속적이라 흡혈보다 소폭 높게.
        //   · critChance(500)×critDamage(250): dps=×(1+치명확률·치명피해)로 서로 곱 커플링.
        //       전형값(치명피해~0.5·치명확률~0.25)을 상대 계수로 반영 → 500/250.
        //   · defPierce(500): 고방어 적에게만 유효(상황적) → 흡혈 대비 할인.
        //   신규축: evasion/absDef(생존, 상한 50%) ~ dmgReduce급 · trueDamage(고정딜, 상한90%)
        //   ~ defPierce보다 강 · accuracy(적 회피 상쇄, 상황형) 저계수.
        powerEffectWeights: {
          critChance: 500,
          critDamage: 250,
          lifesteal: 900,
          defPierce: 500,
          dmgReduce: 1000,
          evasion: 1000,
          absDef: 1000,
          trueDamage: 700,
          accuracy: 200
        },
        // 성장 비용 (지출 곡선) — 시뮬레이터가 밝혀낸 핵심 튜닝 포인트
        levelCostBase: 50,
        levelCostGrowth: 1.15,
        // 레벨업 (growth)
        enhanceCostBase: 40,
        enhanceCostGrowth: 1.25,
        // 각인 (currency)
        gearCostBase: 60,
        gearCostGrowth: 1.3,
        // 장비 강화 (currency)

        // 환생(prestige) 영구 보너스 — 지수적 벽을 넘는 곱셈형 루프.
        // 환생 포인트 1당: 방치 수입 배수 + 글로벌 파워 배수(상한 없음).
        // 파워 배수가 상한 없이 커져야 1.13ⁿ 난이도를 매 환생마다 따라잡는다.
        // 포인트당 파워 0.14 → 필요 환생 횟수↓·곡선 매끄러움↑(cv 0.67→0.53).
        prestigeIncomeBonus: 0.5,
        prestigePowerBonus: 0.14
      });

      // 계정 단위 보정 = 환생(prestige) + 유물(relic) + 펫(pet) 합산.
      //   powerMult    : resolve()에 넘겨 전투력에 곱함
      //   currencyMult / growthMult : 방치 수입에 곱함
      // 새 계정 성장 축을 붙일 때도 여기 한 곳만 곱해주면 전 시스템에 반영된다.
      function accountMods(state) {
        var pr = state.prestige || 0;
        var income = 1 + pr * BALANCE.prestigeIncomeBonus;
        var rm = relicMods(state);
        var pm = petMods(state);
        var rn = rentalMods(state);
        var sm = summonMasteryPower(state); // 소환 숙련도(홀수 레벨 능력치 보상)
        var em = emblemMods(state); // 엠블럼(문장)
        var gd = guardianMods(state); // 정령/가디언
        return {
          powerMult: (1 + pr * BALANCE.prestigePowerBonus) * rm.power * pm.power * rn.power * sm * em.power * gd.power,
          currencyMult: income * rm.currency * pm.currency * rn.currency * em.currency * gd.currency,
          growthMult: income * rm.growth * pm.growth * em.growth * gd.growth
        };
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/BattleDemo.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './gameState.ts', './units.ts', './stats.ts', './formation.ts', './campaign.ts', './character.ts'], function (exports) {
  var _inheritsLoose, _createForOfIteratorHelperLoose, cclegacy, _decorator, Label, UITransform, Color, Node, Layers, Sprite, resources, SpriteFrame, Component, createGameState, createUnit, computePower, autoFormation, formationSummary, CAMPAIGN_CHAPTER_COUNT, fightChapter, chapterReward, levelUp;
  return {
    setters: [function (module) {
      _inheritsLoose = module.inheritsLoose;
      _createForOfIteratorHelperLoose = module.createForOfIteratorHelperLoose;
    }, function (module) {
      cclegacy = module.cclegacy;
      _decorator = module._decorator;
      Label = module.Label;
      UITransform = module.UITransform;
      Color = module.Color;
      Node = module.Node;
      Layers = module.Layers;
      Sprite = module.Sprite;
      resources = module.resources;
      SpriteFrame = module.SpriteFrame;
      Component = module.Component;
    }, function (module) {
      createGameState = module.createGameState;
    }, function (module) {
      createUnit = module.createUnit;
    }, function (module) {
      computePower = module.computePower;
    }, function (module) {
      autoFormation = module.autoFormation;
      formationSummary = module.formationSummary;
    }, function (module) {
      CAMPAIGN_CHAPTER_COUNT = module.CAMPAIGN_CHAPTER_COUNT;
      fightChapter = module.fightChapter;
      chapterReward = module.chapterReward;
    }, function (module) {
      levelUp = module.levelUp;
    }],
    execute: function () {
      var _dec, _class;
      cclegacy._RF.push({}, "0056f/buLFPkrhqcNaP6sko", "BattleDemo", undefined);
      var ccclass = _decorator.ccclass;

      // 데모 파티: 영웅 아트 폴더명(resources/art/hero/<id>) → 원형(archetype)
      var PARTY = [{
        id: 'knight',
        arch: 'VANGUARD'
      }, {
        id: 'barbarian',
        arch: 'STRIKER'
      }, {
        id: 'rogue',
        arch: 'ROGUE'
      }, {
        id: 'ranger',
        arch: 'ARCHER'
      }, {
        id: 'mage',
        arch: 'MAGE'
      }];

      // 재화 표시(추상 키 → 라벨). economy.createWallet 필드와 일치.
      var CURRENCIES = [['currency', '골드'], ['growth', '성장'], ['summon', '소환'], ['gem', '젬']];

      // 탭 정의(왼→오). key로 render 분기.
      var TABS = [['idle', '방치'], ['battle', '전투'], ['heroes', '영웅'], ['summon', '소환']];
      var TOP_Y = 292; // 재화바 y
      var TAB_Y = -292; // 탭바 y
      var HALF_W = 480; // 디자인 해상도 960 → 절반

      var BattleDemo = exports('BattleDemo', (_dec = ccclass('BattleDemo'), _dec(_class = /*#__PURE__*/function (_Component) {
        _inheritsLoose(BattleDemo, _Component);
        function BattleDemo() {
          var _this;
          for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
          }
          _this = _Component.call.apply(_Component, [this].concat(args)) || this;
          _this.state = void 0;
          _this.content = void 0;
          // 화면별 내용이 그려지는 컨테이너
          _this.walletLabel = void 0;
          // 재화바(참조 보관 → 갱신)
          _this.tabNodes = [];
          _this.active = 'idle';
          // 기본 탭 = 방치(홈)
          _this.auto = true;
          return _this;
        }
        var _proto = BattleDemo.prototype;
        // 방치 자동전투 on/off
        _proto.start = function start() {
          this.state = createGameState({
            units: [],
            party: []
          });
          this.setupParty();
          // 데모용 초기 재화(방치 루프가 gem/summon을 채우고, 로스터 레벨업이 growth를 쓴다)
          this.state.wallet.currency = 1200;
          this.state.wallet.growth = 500000;
          this.state.wallet.summon = 3;
          this.state.wallet.gem = 15;
          this.drawTopBar();
          this.drawTabBar();
          this.content = this.makeNode('content', 0, 0);
          this.select(this.active);
        }

        // 방치·전투가 공유하는 데모 파티 1회 구성(레벨 넉넉히 → 초반 챕터 자동 진행)
        ;

        _proto.setupParty = function setupParty() {
          var units = PARTY.map(function (p) {
            return createUnit(p.arch, {
              level: 40,
              rank: 3,
              characterId: p.id
            });
          });
          this.state.units = units;
          this.state.party = units.map(function (u) {
            return u.uid;
          });
          autoFormation(this.state);
        }

        // ── 상단 재화바 ─────────────────────────────────────────────
        ;

        _proto.drawTopBar = function drawTopBar() {
          this.walletLabel = this.addLabel(this.walletText(), 0, TOP_Y, 20);
        };
        _proto.walletText = function walletText() {
          var _this2 = this;
          return CURRENCIES.map(function (_ref) {
            var _this2$state$wallet$k;
            var k = _ref[0],
              name = _ref[1];
            return name + " " + ((_this2$state$wallet$k = _this2.state.wallet[k]) != null ? _this2$state$wallet$k : 0);
          }).join('    ');
        };
        _proto.refreshWallet = function refreshWallet() {
          var _this$walletLabel;
          if ((_this$walletLabel = this.walletLabel) != null && _this$walletLabel.isValid) this.walletLabel.getComponent(Label).string = this.walletText();
        }

        // ── 하단 탭바 ───────────────────────────────────────────────
        ;

        _proto.drawTabBar = function drawTabBar() {
          var _this3 = this;
          var n = TABS.length;
          var step = (HALF_W * 2 - 80) / n; // 좌우 40 여백
          TABS.forEach(function (_ref2, i) {
            var key = _ref2[0],
              label = _ref2[1];
            var x = -HALF_W + 40 + step * (i + 0.5);
            var node = _this3.makeNode('tab_' + key, x, TAB_Y);
            var tf = node.addComponent(UITransform);
            tf.setContentSize(step, 64); // 터치 히트영역(UITransform 필수)
            var lbl = node.addComponent(Label);
            lbl.string = label;
            lbl.fontSize = 22;
            lbl.lineHeight = 26;
            lbl.color = new Color(150, 150, 150, 255);
            node.on(Node.EventType.TOUCH_END, function () {
              return _this3.select(key);
            });
            _this3.tabNodes.push(node);
          });
        }

        // 탭 전환: 방치 스케줄 정지 → 컨텐츠 비우고 렌더 + 탭 강조 갱신
        ;

        _proto.select = function select(key) {
          this.unscheduleAllCallbacks(); // 이전 화면의 방치 루프 정지
          this.active = key;
          this.content.destroyAllChildren();
          this.tabNodes.forEach(function (n, i) {
            var on = TABS[i][0] === key;
            n.getComponent(Label).color = on ? new Color(255, 220, 120, 255) : new Color(150, 150, 150, 255);
          });
          if (key === 'idle') this.renderIdle();else if (key === 'battle') this.renderBattle();else if (key === 'heroes') this.renderHeroes();else if (key === 'summon') this.renderPlaceholder('소환', "\uC18C\uD658 \uC7AC\uD654 " + this.state.wallet.summon + " (\uB2E4\uC74C \uB2E8\uACC4)");
        }

        // ── 방치 화면 — 캠페인 자동 도전 루프 ───────────────────────
        ;

        _proto.renderIdle = function renderIdle() {
          var _this4 = this;
          var c = this.content;
          var progress = this.addLabel('', 0, 200, 22, c);
          var nextInfo = this.addLabel('', 0, 158, 18, c);
          var toggle = this.addLabel('', 0, 108, 20, c);
          toggle.addComponent(UITransform).setContentSize(320, 50);
          var status = this.addLabel('', 0, 62, 16, c);
          var logLabel = this.addLabel('', 0, -40, 15, c); // 최근 로그 여러 줄
          var log = [];
          var refresh = function refresh() {
            var cleared = _this4.state.campaign.cleared;
            progress.getComponent(Label).string = "\uC9C4\uD589: \uCC55\uD130 " + cleared + " / " + CAMPAIGN_CHAPTER_COUNT + " \uD074\uB9AC\uC5B4";
            if (cleared >= CAMPAIGN_CHAPTER_COUNT) {
              nextInfo.getComponent(Label).string = '🎉 전 챕터 클리어!';
            } else {
              var r = chapterReward(cleared);
              nextInfo.getComponent(Label).string = "\uB2E4\uC74C: \uCC55\uD130 " + (cleared + 1) + "  (\uBCF4\uC0C1 \uC82C" + r.gem + " \xB7 \uC18C\uD658" + r.summon + ")";
            }
            toggle.getComponent(Label).string = "[ \uC790\uB3D9\uC804\uD22C: " + (_this4.auto ? 'ON' : 'OFF') + " ]";
          };
          var pushLog = function pushLog(s) {
            log.unshift(s);
            if (log.length > 5) log.pop();
            logLabel.getComponent(Label).string = log.join('\n');
          };
          var setStatus = function setStatus(s) {
            if (status.isValid) status.getComponent(Label).string = s;
          };
          toggle.on(Node.EventType.TOUCH_END, function () {
            _this4.auto = !_this4.auto;
            refresh();
          });
          var tick = function tick() {
            if (!_this4.auto) {
              setStatus('⏸ 일시정지');
              return;
            }
            var cleared = _this4.state.campaign.cleared;
            if (cleared >= CAMPAIGN_CHAPTER_COUNT) {
              setStatus('완주!');
              return;
            }
            var r = fightChapter(_this4.state, cleared);
            if (!r.ok) {
              setStatus(r.reason);
              _this4.auto = false;
            } else if (r.win) {
              pushLog("\u2705 \uCC55\uD130 " + (cleared + 1) + " \uD074\uB9AC\uC5B4  +\uC82C" + r.reward.gem + " +\uC18C\uD658" + r.reward.summon);
              _this4.refreshWallet();
              setStatus('⚔ 승리!');
            } else {
              var _r$margin;
              pushLog("\u2716 \uCC55\uD130 " + (cleared + 1) + " \uB3C4\uC804 \uC2E4\uD328 (\uACA9\uCC28 " + Math.round((_r$margin = r.margin) != null ? _r$margin : 0) + ")");
              setStatus('전투력 부족 — 자동 정지');
              _this4.auto = false;
            }
            refresh();
          };
          refresh();
          this.schedule(tick, 1.5); // 1.5초마다 다음 챕터 도전
        }

        // ── 전투 화면(공유 파티를 진형별로 배치) ──────────────────────
        ;

        _proto.renderBattle = function renderBattle() {
          var _this5 = this;
          var sum = formationSummary(this.state);
          var byId = {};
          for (var _iterator = _createForOfIteratorHelperLoose(this.state.units), _step; !(_step = _iterator()).done;) {
            var u = _step.value;
            byId[u.uid] = u;
          }
          this.addLabel("\uC804\uD22C \xB7 \uC804\uC5F4 " + sum.front.length + " / \uC911\uC5F4 " + sum.mid.length + " / \uD6C4\uC5F4 " + sum.back.length, 0, 230, 20, this.content);
          var place = function place(uids, y, tag) {
            var n = uids.length;
            uids.forEach(function (uid, i) {
              var u = byId[uid];
              var x = (i - (n - 1) / 2) * 150;
              _this5.addHero(String(u.characterId), computePower(u), x, y);
            });
            if (n > 0) _this5.addLabel(tag, -360, y, 16, _this5.content);
          };
          place(sum.front, 110, '전열');
          place(sum.mid, -30, '중열');
          place(sum.back, -170, '후열');
        }

        // ── 영웅 로스터 — 보유 유닛 목록 + 레벨업(성장→방치 재도전 루프) ──
        ;

        _proto.renderHeroes = function renderHeroes() {
          var _this6 = this;
          var c = this.content;
          this.addLabel("\uC601\uC6C5 \uB85C\uC2A4\uD130 (" + this.state.units.length + "\uC885)", 0, 245, 24, c);
          var sum = formationSummary(this.state);
          var posOf = function posOf(uid) {
            return sum.front.includes(uid) ? '전열' : sum.mid.includes(uid) ? '중열' : sum.back.includes(uid) ? '후열' : '-';
          };
          this.state.units.forEach(function (u, i) {
            var row = _this6.makeNode('row_' + u.uid, 0, 175 - i * 78);
            row.parent = c;
            _this6.addSprite(String(u.characterId), -390, 0, row, 60);
            var info = _this6.addLabel('', -330, 13, 16, row);
            var power = _this6.addLabel('', -330, -13, 14, row);
            info.getComponent(Label).horizontalAlign = Label.HorizontalAlign.LEFT;
            power.getComponent(Label).horizontalAlign = Label.HorizontalAlign.LEFT;
            var update = function update() {
              info.getComponent(Label).string = u.characterId + " (" + u.archetype + ")  Lv." + u.level + " \u2605" + u.star + "  [" + posOf(u.uid) + "]";
              power.getComponent(Label).string = "\u2694 " + computePower(u);
            };
            update();
            var btn = _this6.addLabel('[ Lv+ ]', 350, 0, 20, row);
            btn.getComponent(Label).color = new Color(255, 220, 120, 255);
            btn.addComponent(UITransform).setContentSize(130, 60);
            btn.on(Node.EventType.TOUCH_END, function () {
              var r = levelUp(_this6.state, u.uid);
              if (r.ok) {
                update();
                _this6.refreshWallet();
              } else {
                power.getComponent(Label).string = "\u2694 " + computePower(u) + "  \xB7 " + r.reason;
              }
            });
          });
        };
        _proto.renderPlaceholder = function renderPlaceholder(title, sub) {
          this.addLabel(title, 0, 40, 28, this.content);
          this.addLabel(sub, 0, -10, 18, this.content);
        }

        // ── 헬퍼 ────────────────────────────────────────────────────
        ;

        _proto.makeNode = function makeNode(name, x, y) {
          var node = new Node(name);
          node.layer = Layers.Enum.UI_2D;
          node.parent = this.node;
          node.setPosition(x, y, 0);
          return node;
        };
        _proto.addLabel = function addLabel(text, x, y, size, parent) {
          if (size === void 0) {
            size = 16;
          }
          if (parent === void 0) {
            parent = this.node;
          }
          var node = new Node('label');
          node.layer = Layers.Enum.UI_2D;
          node.parent = parent;
          node.setPosition(x, y, 0);
          var lbl = node.addComponent(Label);
          lbl.string = text;
          lbl.fontSize = size;
          lbl.lineHeight = size + 6;
          lbl.color = new Color(240, 240, 240, 255);
          return node;
        };
        _proto.addHero = function addHero(artKey, power, x, y) {
          this.addSprite(artKey, x, y, this.content, 96);
          this.addLabel(artKey + "  \u2694" + power, x, y - 62, 13, this.content);
        }

        // 영웅 스프라이트 1개(라벨 없이). 임포트 전이면 로드 실패해도 화면은 정상.
        ;

        _proto.addSprite = function addSprite(artKey, x, y, parent, size) {
          if (size === void 0) {
            size = 96;
          }
          var node = new Node('sprite_' + artKey);
          node.layer = Layers.Enum.UI_2D;
          node.parent = parent;
          node.setPosition(x, y, 0);
          var tf = node.addComponent(UITransform);
          tf.setContentSize(size, size);
          var sp = node.addComponent(Sprite);
          sp.sizeMode = Sprite.SizeMode.CUSTOM;
          resources.load("art/hero/" + artKey + "/idle1/spriteFrame", SpriteFrame, function (err, frame) {
            if (!err && frame && sp.isValid) sp.spriteFrame = frame;
          });
          return node;
        };
        return BattleDemo;
      }(Component)) || _class));
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/buildcopy.ts", ['cc', './gameState.ts', './formation.ts', './character.ts', './skills.ts'], function (exports) {
  var cclegacy, getPartyUnits, unitRole, setFormation, FORMATION_ROLES, equipSkill, skillSlots;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      getPartyUnits = module.getPartyUnits;
    }, function (module) {
      unitRole = module.unitRole;
      setFormation = module.setFormation;
      FORMATION_ROLES = module.FORMATION_ROLES;
    }, function (module) {
      equipSkill = module.equipSkill;
    }, function (module) {
      skillSlots = module.skillSlots;
    }],
    execute: function () {
      exports({
        applyBuild: applyBuild,
        applyBuildCode: applyBuildCode,
        decodeBuild: decodeBuild,
        encodeBuild: encodeBuild,
        exportBuild: exportBuild
      });
      cclegacy._RF.push({}, "0bab1LHNpVMar1qRbIoUGb4", "buildcopy", undefined);

      // ─────────────────────────────────────────────────────────────
      // 원클릭 덱 복사(로컬) — 파티 "위치별" 스킬 로드아웃 + 진형을 코드로 주고받는다.
      //   · 유닛 인스턴스는 계정마다 다르므로 "슬롯 인덱스 기준"으로 적용한다.
      //   · 복사되는 것: 각 자리의 스킬 구성 + 전열/후열 배치(전략의 핵심).
      //   · 장비는 인스턴스 자산이라 로컬 복사 대상에서 제외(안내만). 서버 시 확장.
      //   추천덱/봇덱/다른 유저덱을 버튼 하나로 내 파티에 적용하는 용도.
      // ─────────────────────────────────────────────────────────────

      var BUILD_CODE_PREFIX = exports('BUILD_CODE_PREFIX', 'DECK1:');

      // 현재 파티 → 빌드 객체(위치 순서 보존).
      function exportBuild(state) {
        var party = getPartyUnits(state);
        return {
          v: 1,
          slots: party.map(function (u) {
            return {
              archetype: u.archetype,
              // 참고용(호환 표시)
              role: unitRole(state, u.uid),
              skills: (u.skills || []).map(function (s) {
                return s && s.id || null;
              })
            };
          })
        };
      }

      // 빌드 → 공유 코드 문자열(왕복 가능, base64-ish JSON).
      function encodeBuild(build) {
        var json = JSON.stringify(build);
        var b64 = typeof btoa === 'function' ? btoa(unescape(encodeURIComponent(json))) : Buffer.from(json, 'utf8').toString('base64');
        return BUILD_CODE_PREFIX + b64;
      }
      function decodeBuild(code) {
        if (typeof code !== 'string' || !code.startsWith(BUILD_CODE_PREFIX)) return null;
        try {
          var b64 = code.slice(BUILD_CODE_PREFIX.length);
          var json = typeof atob === 'function' ? decodeURIComponent(escape(atob(b64))) : Buffer.from(b64, 'base64').toString('utf8');
          var build = JSON.parse(json);
          if (!build || !Array.isArray(build.slots)) return null;
          return build;
        } catch (_unused) {
          return null;
        }
      }

      // 빌드를 현재 파티에 적용(위치 인덱스 매칭). 무료(자원 소모 없음) — 재배치일 뿐.
      //   반환: { ok, applied(자리 수), skills(장착 성공 스킬 수), skipped }
      function applyBuild(state, build) {
        if (!build || !Array.isArray(build.slots)) return {
          ok: false,
          reason: '잘못된 빌드'
        };
        var party = getPartyUnits(state);
        var applied = 0,
          skills = 0,
          skipped = 0;
        party.forEach(function (u, i) {
          var slot = build.slots[i];
          if (!slot) {
            skipped += 1;
            return;
          }
          applied += 1;
          // 진형 적용(전열/중열/후열). 알 수 없는 값은 전열로 폴백.
          setFormation(state, u.uid, FORMATION_ROLES.includes(slot.role) ? slot.role : 'front');
          // 스킬 로드아웃 적용(내 유닛이 열 수 있는 슬롯까지만).
          var cap = skillSlots(u);
          (slot.skills || []).forEach(function (sid, si) {
            if (!sid || si >= cap) return;
            try {
              if (equipSkill(state, u.uid, si, sid).ok) skills += 1;
            } catch (_unused2) {/* 알 수 없는 스킬 ID 무시 */}
          });
        });
        return {
          ok: applied > 0,
          applied: applied,
          skills: skills,
          skipped: skipped
        };
      }

      // 편의 래퍼: 코드 문자열을 바로 적용.
      function applyBuildCode(state, code) {
        var build = decodeBuild(code);
        if (!build) return {
          ok: false,
          reason: '잘못된 코드'
        };
        return applyBuild(state, build);
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/campaign.ts", ['cc', './progression.ts', './resolution.ts', './gameState.ts', './balance.ts', './economy.ts'], function (exports) {
  var cclegacy, getStage, resolve, getPartyUnits, accountMods, earn;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      getStage = module.getStage;
    }, function (module) {
      resolve = module.resolve;
    }, function (module) {
      getPartyUnits = module.getPartyUnits;
    }, function (module) {
      accountMods = module.accountMods;
    }, function (module) {
      earn = module.earn;
    }],
    execute: function () {
      exports({
        bossChallenge: bossChallenge,
        campaignChapters: campaignChapters,
        chapterReward: chapterReward,
        fightChapter: fightChapter,
        storyLog: storyLog
      });
      cclegacy._RF.push({}, "c9d7dyMaUFAZbJBN33L77db", "campaign", undefined);

      // ─────────────────────────────────────────────────────────────
      // 스토리 캠페인 — 장르/컨셉 무관 진행 로직. 서사(텍스트)는 Concept가 제공.
      //   · 챕터마다 보스 전투(파티 vs 강화된 적). 승리 시 다음 챕터 해금 + 보상.
      //   · 같은 resolve() 엔진 사용 → 방치/RPG와 완전히 동일한 판정.
      //   · 씨앗의 "서사 발현"과 맥을 같이 하는 월드 스토리 축.
      // 진행도: state.campaign.cleared (클리어한 챕터 수).
      // ─────────────────────────────────────────────────────────────

      var CAMPAIGN_CHAPTER_COUNT = exports('CAMPAIGN_CHAPTER_COUNT', 12);

      // 챕터 i(0-based)의 보스 난이도 — 진행 스테이지 기반 + 보스 강화.
      function bossStageFor(i) {
        return 6 + i * 7;
      } // 6,13,20,…55
      function bossChallenge(i) {
        var c = getStage(bossStageFor(i)).challenge;
        return {
          hp: Math.round(c.hp * 1.7),
          atk: Math.round(c.atk * 1.25),
          def: Math.round(c.def * 1.2),
          element: c.element
        };
      }
      function chapterReward(i) {
        return {
          gem: 30 + i * 10,
          summon: 20 + i * 5
        };
      }

      // Concept가 넘긴 서사 배열과 결합해 챕터 목록을 만든다.
      function campaignChapters(state, conceptCampaign) {
        if (conceptCampaign === void 0) {
          conceptCampaign = [];
        }
        var cleared = state.campaign && state.campaign.cleared || 0;
        var out = [];
        for (var i = 0; i < CAMPAIGN_CHAPTER_COUNT; i++) {
          var lore = conceptCampaign[i] || {
            title: "\uCC55\uD130 " + (i + 1),
            story: ''
          };
          out.push({
            index: i,
            title: lore.title,
            story: lore.story,
            unlocked: i <= cleared,
            cleared: i < cleared,
            isNext: i === cleared && i < CAMPAIGN_CHAPTER_COUNT,
            boss: bossChallenge(i),
            bossStage: bossStageFor(i),
            reward: chapterReward(i)
          });
        }
        return out;
      }

      // 스토리 정주행 도감 — 클리어한 챕터의 서사만 모아 다시 읽는 로그.
      //   플레이 중엔 성장을 위해 스킵하지만, 나중에 여유가 생겼을 때 모아본다.
      //   반환: { readable:[{index,title,story}], lockedCount, total }
      function storyLog(state, conceptCampaign) {
        if (conceptCampaign === void 0) {
          conceptCampaign = [];
        }
        var chapters = campaignChapters(state, conceptCampaign);
        var readable = chapters.filter(function (c) {
          return c.cleared && c.story;
        }) // 클리어한 챕터만 정주행 가능
        .map(function (c) {
          return {
            index: c.index,
            title: c.title,
            story: c.story
          };
        });
        return {
          readable: readable,
          lockedCount: chapters.length - readable.length,
          total: chapters.length
        };
      }

      // 챕터 도전. 승리 & 최초 클리어면 보상 + 진행.
      function fightChapter(state, i) {
        var cleared = state.campaign && state.campaign.cleared || 0;
        if (i > cleared) return {
          ok: false,
          reason: '이전 챕터를 먼저 클리어하세요'
        };
        var party = getPartyUnits(state);
        if (!party.length) return {
          ok: false,
          reason: '파티 없음'
        };
        var res = resolve(party, bossChallenge(i), accountMods(state), state.formation);
        if (!res.win) return {
          ok: true,
          win: false,
          margin: res.margin
        };
        var reward = null;
        if (i === cleared) {
          reward = chapterReward(i);
          earn(state.wallet, reward);
          state.campaign.cleared = cleared + 1;
        }
        return {
          ok: true,
          win: true,
          reward: reward,
          cleared: state.campaign.cleared,
          allClear: state.campaign.cleared >= CAMPAIGN_CHAPTER_COUNT
        };
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/character.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './economy.ts', './units.ts', './skills.ts', './enhance.ts', './starGrade.ts', './stats.ts'], function (exports) {
  var _createForOfIteratorHelperLoose, cclegacy, spend, levelCap, levelUpCost, skillSlots, getSkill, skillUpCost, AWAKEN_MAX, awakenCost, ENHANCE_CAP, getEnhanceNode, enhanceCost, availableDupes, computePower;
  return {
    setters: [function (module) {
      _createForOfIteratorHelperLoose = module.createForOfIteratorHelperLoose;
    }, function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      spend = module.spend;
    }, function (module) {
      levelCap = module.levelCap;
      levelUpCost = module.levelUpCost;
    }, function (module) {
      skillSlots = module.skillSlots;
      getSkill = module.getSkill;
      skillUpCost = module.skillUpCost;
      AWAKEN_MAX = module.AWAKEN_MAX;
      awakenCost = module.awakenCost;
    }, function (module) {
      ENHANCE_CAP = module.ENHANCE_CAP;
      getEnhanceNode = module.getEnhanceNode;
      enhanceCost = module.enhanceCost;
    }, function (module) {
      availableDupes = module.availableDupes;
    }, function (module) {
      computePower = module.computePower;
    }],
    execute: function () {
      exports({
        ascend: ascend,
        ascendCost: ascendCost,
        awakenSignature: awakenSignature,
        enhanceNode: enhanceNode,
        equipSkill: equipSkill,
        levelUp: levelUp,
        smartEnhance: smartEnhance,
        unequipSkill: unequipSkill,
        upgradeSkill: upgradeSkill
      });
      cclegacy._RF.push({}, "ca0cd0UY0BGi4Ij6/anNXoQ", "character", undefined);

      // ─────────────────────────────────────────────────────────────
      // 캐릭터 성장 액션 — 장르 무관(RPG도 방치형도 캐릭터를 키운다).
      // 상태(state.wallet)에서 자원을 소모하고 유닛을 강하게 만든다.
      // 모든 액션은 { ok, ... } 를 반환한다.
      // ─────────────────────────────────────────────────────────────

      function findUnit(state, uid) {
        var u = state.units.find(function (x) {
          return x.uid === uid;
        });
        if (!u) throw new Error("\uC720\uB2DB \uC5C6\uC74C: " + uid);
        return u;
      }

      // ── 레벨업 ────────────────────────────────────────────────────
      function levelUp(state, uid) {
        var unit = findUnit(state, uid);
        if (unit.level >= levelCap(unit)) {
          return {
            ok: false,
            reason: "\uB808\uBCA8 \uC0C1\uD55C " + levelCap(unit) + " (\uB3CC\uD30C \uD544\uC694)"
          };
        }
        var cost = levelUpCost(unit);
        if (!spend(state.wallet, cost)) return {
          ok: false,
          reason: '성장 재료 부족',
          cost: cost
        };
        unit.level += 1;
        return {
          ok: true,
          level: unit.level,
          cost: cost
        };
      }

      // ── 돌파(랭크업) : 레벨 상한을 열고 스킬 슬롯을 늘린다 ──────────
      // 소환석을 우선 소모(랭크가 오를수록 요구량이 우상향), 부족하면 동일
      // 영웅 중복 1명 소모로 대체(장비·룬은 회수, 성급 강화용 중복 풀과 공유).
      function ascendCost(unit) {
        var r = unit.rank || 1;
        return {
          summon: 20 * r * r
        };
      }
      function ascend(state, uid) {
        var unit = findUnit(state, uid);
        var cost = ascendCost(unit);
        if (spend(state.wallet, cost)) {
          unit.rank += 1;
          return {
            ok: true,
            rank: unit.rank,
            used: 'summon',
            cost: cost,
            newCap: levelCap(unit),
            slots: skillSlots(unit)
          };
        }
        // 소환석 부족 → 동일 영웅 중복 1명 소모로 대체
        var dupe = availableDupes(state, unit)[0];
        if (!dupe) return {
          ok: false,
          reason: '소환석 부족 · 동일 영웅 중복 없음',
          cost: cost
        };
        state.inventory = state.inventory || [];
        state.runeBag = state.runeBag || [];
        for (var _i = 0, _Object$keys = Object.keys(dupe.gear || {}); _i < _Object$keys.length; _i++) {
          var slot = _Object$keys[_i];
          var it = dupe.gear[slot];
          if (it) state.inventory.push(it);
        }
        for (var _iterator = _createForOfIteratorHelperLoose(dupe.runes || []), _step; !(_step = _iterator()).done;) {
          var r = _step.value;
          if (r) state.runeBag.push(r);
        }
        if (state.profile && state.profile.avatarUid === dupe.uid) state.profile.avatarUid = null;
        state.units = state.units.filter(function (u) {
          return u.uid !== dupe.uid;
        });
        unit.rank += 1;
        return {
          ok: true,
          rank: unit.rank,
          used: 'dupe',
          consumedUid: dupe.uid,
          newCap: levelCap(unit),
          slots: skillSlots(unit)
        };
      }

      // ── 강화(통합) : 레벨 → 돌파 → 각인을 지금 자원으로 한 번에 ──────
      // "강화" 버튼 하나가 전투력을 가장 크게 올리는 순서로 자동 진행한다.
      //   1) 상한까지 레벨업  2) 상한이면 돌파 후 다시 레벨업  3) 막히면 남은 재화로 각인.
      // 각 단계는 재화가 다르다(레벨=growth · 돌파=summon/중복 · 각인=currency)—
      //   있는 재화만큼만 쓰고, 셋 다 막히면 멈춘다. 되돌리기는 없다(소비형).
      var ENHANCE_NODES = ['atk', 'hp', 'def', 'crit'];
      function smartEnhance(state, uid) {
        var unit = findUnit(state, uid);
        var before = computePower(unit);
        var levels = 0,
          ascends = 0,
          enhances = 0;
        var GUARD = 100000; // 무한루프 안전 상한(재화가 비정상적으로 많아도 종료)
        var steps = 0;
        // 1~2) 레벨업 → (상한이면) 돌파 → 반복
        while (steps++ < GUARD) {
          if (levelUp(state, uid).ok) {
            levels++;
            continue;
          }
          if (unit.level >= levelCap(unit) && ascend(state, uid).ok) {
            ascends++;
            continue;
          }
          break; // 성장재화 부족, 또는 상한+돌파불가
        }
        // 3) 남은 강화재화로 각인 — 가장 낮은 노드부터 골라 균등하게 올린다.
        while (steps++ < GUARD) {
          var target = ENHANCE_NODES.filter(function (s) {
            return (unit.enhance[s] || 0) < ENHANCE_CAP;
          }).sort(function (a, b) {
            return (unit.enhance[a] || 0) - (unit.enhance[b] || 0);
          })[0];
          if (!target || !enhanceNode(state, uid, target).ok) break;
          enhances++;
        }
        var after = computePower(unit);
        return {
          ok: levels + ascends + enhances > 0,
          levels: levels,
          ascends: ascends,
          enhances: enhances,
          before: before,
          after: after,
          gain: after - before
        };
      }

      // ── 스킬 장착 ─────────────────────────────────────────────────
      function equipSkill(state, uid, slotIndex, skillId) {
        var _unit$skills$slotInde;
        var unit = findUnit(state, uid);
        getSkill(skillId); // 검증
        if (slotIndex < 0 || slotIndex >= skillSlots(unit)) {
          return {
            ok: false,
            reason: "\uC2AC\uB86F " + slotIndex + " \uC7A0\uAE40 (\uD604\uC7AC " + skillSlots(unit) + "\uAC1C, \uB3CC\uD30C \uD544\uC694)"
          };
        }
        // 같은 스킬 중복 장착 방지
        var dup = unit.skills.some(function (s, i) {
          return s && s.id === skillId && i !== slotIndex;
        });
        if (dup) return {
          ok: false,
          reason: '이미 장착된 스킬'
        };
        unit.skills[slotIndex] = {
          id: skillId,
          level: ((_unit$skills$slotInde = unit.skills[slotIndex]) == null ? void 0 : _unit$skills$slotInde.id) === skillId ? unit.skills[slotIndex].level : 1
        };
        return {
          ok: true,
          slot: slotIndex,
          skill: skillId
        };
      }
      function unequipSkill(state, uid, slotIndex) {
        var unit = findUnit(state, uid);
        unit.skills[slotIndex] = null;
        return {
          ok: true
        };
      }

      // ── 스킬 강화(레벨업) ─────────────────────────────────────────
      function upgradeSkill(state, uid, slotIndex) {
        var unit = findUnit(state, uid);
        var slot = unit.skills[slotIndex];
        if (!slot || !slot.id) return {
          ok: false,
          reason: '빈 슬롯'
        };
        var cost = skillUpCost(slot.level);
        if (!spend(state.wallet, cost)) return {
          ok: false,
          reason: '스킬 강화 재료 부족',
          cost: cost
        };
        slot.level += 1;
        return {
          ok: true,
          skill: slot.id,
          level: slot.level,
          cost: cost
        };
      }

      // ── 시그니처 각성 : 고유 스킬에 2차 효과를 연다 ────────────────
      function awakenSignature(state, uid) {
        var unit = findUnit(state, uid);
        if (!unit.signature) return {
          ok: false,
          reason: '고유 스킬 없음'
        };
        var cur = unit.sigAwaken || 0;
        if (cur >= AWAKEN_MAX) return {
          ok: false,
          reason: "\uAC01\uC131 \uC0C1\uD55C " + AWAKEN_MAX
        };
        var cost = awakenCost(cur);
        if (!spend(state.wallet, cost)) return {
          ok: false,
          reason: '각성 재료 부족',
          cost: cost
        };
        unit.sigAwaken = cur + 1;
        return {
          ok: true,
          level: unit.sigAwaken,
          cost: cost
        };
      }

      // ── 강화(각인) : 특정 스탯에 집중 투자 ────────────────────────
      function enhanceNode(state, uid, stat) {
        var unit = findUnit(state, uid);
        getEnhanceNode(stat); // 검증
        var cur = unit.enhance[stat] || 0;
        if (cur >= ENHANCE_CAP) return {
          ok: false,
          reason: "\uAC15\uD654 \uC0C1\uD55C " + ENHANCE_CAP
        };
        var cost = enhanceCost(cur);
        if (!spend(state.wallet, cost)) return {
          ok: false,
          reason: '강화 재료 부족',
          cost: cost
        };
        unit.enhance[stat] = cur + 1;
        return {
          ok: true,
          stat: stat,
          level: unit.enhance[stat],
          cost: cost
        };
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/compshop.ts", ['cc', './economy.ts', './progression.ts'], function (exports) {
  var cclegacy, earn, getStage;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      earn = module.earn;
    }, function (module) {
      getStage = module.getStage;
    }],
    execute: function () {
      exports({
        compGrantPreview: compGrantPreview,
        compPurchase: compPurchase
      });
      cclegacy._RF.push({}, "581a74X+xdHy4g+3n3ub1cR", "compshop", undefined);

      // ─────────────────────────────────────────────────────────────
      // 경쟁 상점 — 아레나 포인트 / 길드 코인의 "사용처".
      // 두 재화는 지갑(wallet)이 아니라 state.arena.points / state.guild.coins 에 쌓인다.
      // 여기서 그걸 소모해 실 자원(소환권·다이아·골드·정수)으로 환전한다.
      // grant의 *Stage 키는 진행도(peakStage) 보상에 비례해 스케일(상점과 동일 규약).
      // ─────────────────────────────────────────────────────────────

      var COMP_SHOP = exports('COMP_SHOP', {
        // 아레나 포인트(랭크전 누적)로 구매
        arena: [{
          id: 'AP_SUMMON',
          label: '소환권 교환',
          cost: 100,
          grant: {
            summon: 30
          }
        }, {
          id: 'AP_GEM',
          label: '다이아 교환',
          cost: 150,
          grant: {
            gem: 20
          }
        }, {
          id: 'AP_GOLD',
          label: '골드 대량',
          cost: 60,
          grant: {
            currencyStage: 120
          }
        }],
        // 길드 코인(보스 레이드 기여)으로 구매
        guild: [{
          id: 'GC_GROWTH',
          label: '정수 대량',
          cost: 40,
          grant: {
            growthStage: 150
          }
        }, {
          id: 'GC_SUMMON',
          label: '소환권 교환',
          cost: 80,
          grant: {
            summon: 25
          }
        }, {
          id: 'GC_GEM',
          label: '다이아 교환',
          cost: 120,
          grant: {
            gem: 25
          }
        }]
      });

      // 재화 종류별 잔액 접근자
      function balanceOf(state, kind) {
        var _state$arena, _state$guild;
        return kind === 'arena' ? ((_state$arena = state.arena) == null ? void 0 : _state$arena.points) || 0 : ((_state$guild = state.guild) == null ? void 0 : _state$guild.coins) || 0;
      }
      function deduct(state, kind, amount) {
        if (kind === 'arena') state.arena.points -= amount;else state.guild.coins -= amount;
      }
      function find(kind, id) {
        return (COMP_SHOP[kind] || []).find(function (p) {
          return p.id === id;
        });
      }

      // grant 정의 → 실제 지급량 (진행도 스케일 반영)
      function resolveGrant(state, grant) {
        var st = getStage(state.peakStage).rewards;
        var out = {};
        for (var _i = 0, _arr = Object.entries(grant); _i < _arr.length; _i++) {
          var _arr$_i = _arr[_i],
            k = _arr$_i[0],
            v = _arr$_i[1];
          if (k === 'currencyStage') out.currency = (out.currency || 0) + Math.round(st.currency * v);else if (k === 'growthStage') out.growth = (out.growth || 0) + Math.round(st.growth * v);else out[k] = (out[k] || 0) + v;
        }
        return out;
      }

      // 표시용: 현재 진행도 기준 지급량 미리보기
      function compGrantPreview(state, grant) {
        return resolveGrant(state, grant);
      }

      // 구매 처리. 성공 시 { ok, grant, spent, balance }.
      function compPurchase(state, kind, id) {
        var p = find(kind, id);
        if (!p) return {
          ok: false,
          reason: '알 수 없는 상품'
        };
        var bal = balanceOf(state, kind);
        if (bal < p.cost) return {
          ok: false,
          reason: '재화 부족',
          need: p.cost,
          have: bal
        };
        deduct(state, kind, p.cost);
        var g = resolveGrant(state, p.grant);
        earn(state.wallet, g);
        return {
          ok: true,
          grant: g,
          spent: p.cost,
          balance: balanceOf(state, kind)
        };
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/console.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './roles.ts'], function (exports) {
  var _createForOfIteratorHelperLoose, cclegacy, can;
  return {
    setters: [function (module) {
      _createForOfIteratorHelperLoose = module.createForOfIteratorHelperLoose;
    }, function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      can = module.can;
    }],
    execute: function () {
      exports({
        buildEventConfig: buildEventConfig,
        buildMailPayload: buildMailPayload,
        buildNoticeConfig: buildNoticeConfig,
        canOpenConsole: canOpenConsole,
        consoleCapabilities: consoleCapabilities,
        validateNotice: validateNotice
      });
      cclegacy._RF.push({}, "eaae8pXPFJFvaGLCjAl1scr", "console", undefined);
      var NOTICE_MAX = exports('NOTICE_MAX', 140); // 공지 최대 길이(배너 2줄 기준)

      // 공지/이벤트 텍스트 정규화·검증. { ok, text?, reason? }
      function validateNotice(text) {
        var t = (text == null ? '' : String(text)).trim();
        if (!t) return {
          ok: false,
          reason: '내용을 입력하세요'
        };
        if (t.length > NOTICE_MAX) return {
          ok: false,
          reason: "\uCD5C\uB300 " + NOTICE_MAX + "\uC790\uAE4C\uC9C0 \uAC00\uB2A5\uD569\uB2C8\uB2E4 (\uD604\uC7AC " + t.length + "\uC790)"
        };
        return {
          ok: true,
          text: t
        };
      }

      // 공지 설정 구성 → remote_config 에 넣을 { key, value(JSON 문자열) }.
      function buildNoticeConfig(text, _temp) {
        var _ref = _temp === void 0 ? {} : _temp,
          _ref$url = _ref.url,
          url = _ref$url === void 0 ? null : _ref$url;
        var v = validateNotice(text);
        if (!v.ok) return v;
        var payload = url ? {
          text: v.text,
          url: url
        } : {
          text: v.text
        };
        return {
          ok: true,
          key: 'notice',
          value: JSON.stringify(payload)
        };
      }

      // 이벤트 배너 설정 구성.
      function buildEventConfig(text) {
        var v = validateNotice(text);
        if (!v.ok) return v;
        return {
          ok: true,
          key: 'event',
          value: JSON.stringify({
            text: v.text
          })
        };
      }

      // 우편 보상으로 허용되는 재화 키(economy wallet 과 일치).
      var MAIL_REWARD_KEYS = exports('MAIL_REWARD_KEYS', ['currency', 'gem', 'summon', 'growth']);

      // 우편 발송 페이로드 검증·정리. { ok, title, rewards } | { ok:false, reason }.
      //   제목만 있으면 발송 가능(안내 우편). rewards는 선택 — 0/음수/빈값은 제거.
      function buildMailPayload(_temp2) {
        var _ref2 = _temp2 === void 0 ? {} : _temp2,
          title = _ref2.title,
          _ref2$rewards = _ref2.rewards,
          rewards = _ref2$rewards === void 0 ? {} : _ref2$rewards;
        var t = (title == null ? '' : String(title)).trim();
        if (!t) return {
          ok: false,
          reason: '우편 제목을 입력하세요'
        };
        if (t.length > NOTICE_MAX) return {
          ok: false,
          reason: "\uC81C\uBAA9\uC740 \uCD5C\uB300 " + NOTICE_MAX + "\uC790\uC785\uB2C8\uB2E4"
        };
        var clean = {};
        for (var _iterator = _createForOfIteratorHelperLoose(MAIL_REWARD_KEYS), _step; !(_step = _iterator()).done;) {
          var k = _step.value;
          var n = Math.floor(Number(rewards[k]));
          if (Number.isFinite(n) && n > 0) clean[k] = n;
        }
        return {
          ok: true,
          title: t,
          rewards: clean
        };
      }

      // 역할이 콘솔에 들어올 수 있나(공지 발송 권한 = 매니저 이상).
      function canOpenConsole(role) {
        return can(role, 'sendNotice');
      }

      // 역할이 각 콘솔 액션을 할 수 있나 → UI 활성/비활성 판단용.
      function consoleCapabilities(role) {
        return {
          notice: can(role, 'sendNotice'),
          event: can(role, 'manageEvent'),
          balance: can(role, 'tuneBalance') // 운영자 조작(밸런스)은 admin만
        };
      }

      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/cosmetics.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './economy.ts'], function (exports) {
  var _extends, cclegacy, spend;
  return {
    setters: [function (module) {
      _extends = module.extends;
    }, function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      spend = module.spend;
    }],
    execute: function () {
      exports({
        buyCosmetic: buyCosmetic,
        equipCosmetic: equipCosmetic,
        getProfile: getProfile,
        grantPremium: grantPremium,
        hasPremium: hasPremium,
        ownsCosmetic: ownsCosmetic,
        setAvatar: setAvatar,
        setProfileName: setProfileName
      });
      cclegacy._RF.push({}, "71fc9hJXUxELpBAp+jqqSZE", "cosmetics", undefined);

      // ─────────────────────────────────────────────────────────────
      // 개성(코스메틱) — 윤리적 BM 축. "과시/편의"에 값을 매기되 전투력엔 무관.
      //   · 프로필 프레임 · 칭호  : 순수 외형(능력치 0)
      //   · 프로필(닉네임·대표영웅) : 계정 정체성 커스터마이즈
      //   · 광고제거 프리미엄 패스  : 편의 구매(pay-for-convenience, 비 pay-to-win)
      // 어떤 항목도 stats/확률에 관여하지 않는다 — 코어는 이를 강제 보장한다.
      // ─────────────────────────────────────────────────────────────

      // 프로필 프레임 (순수 외형)
      var PROFILE_FRAMES = exports('PROFILE_FRAMES', {
        none: {
          id: 'none',
          label: '기본',
          emoji: '◻️',
          cost: null
        },
        bronze: {
          id: 'bronze',
          label: '청동 테',
          emoji: '🟫',
          cost: {
            gem: 300
          }
        },
        silver: {
          id: 'silver',
          label: '은빛 테',
          emoji: '⬜',
          cost: {
            gem: 800
          }
        },
        gold: {
          id: 'gold',
          label: '황금 테',
          emoji: '🟨',
          cost: {
            gem: 2000
          }
        },
        mythic: {
          id: 'mythic',
          label: '신화 테',
          emoji: '🟪',
          cost: {
            gem: 5000
          }
        }
      });

      // 칭호 (순수 외형)
      var PROFILE_TITLES = exports('PROFILE_TITLES', {
        none: {
          id: 'none',
          label: '칭호 없음',
          cost: null
        },
        novice: {
          id: 'novice',
          label: '견습 조련사',
          cost: {
            gem: 200
          }
        },
        hunter: {
          id: 'hunter',
          label: '심연 사냥꾼',
          cost: {
            gem: 1000
          }
        },
        legend: {
          id: 'legend',
          label: '엘 로그의 전설',
          cost: {
            gem: 3000
          }
        }
      });
      var CATALOG = {
        frame: PROFILE_FRAMES,
        title: PROFILE_TITLES
      };
      var PROFILE_NAME_MAX = exports('PROFILE_NAME_MAX', 12);
      var DEFAULT_PROFILE_NAME = exports('DEFAULT_PROFILE_NAME', '조련사');

      // 내부: profile 구조 보장.
      function ensure(state) {
        state.profile = state.profile || {};
        var p = state.profile;
        p.owned = p.owned || {};
        p.owned.frame = p.owned.frame || {};
        p.owned.title = p.owned.title || {};
        return p;
      }

      // 표시용 정규화 프로필.
      function getProfile(state) {
        var p = state.profile || {};
        return {
          name: p.name || DEFAULT_PROFILE_NAME,
          avatarUid: p.avatarUid || null,
          frame: p.frame || 'none',
          title: p.title || 'none',
          premium: !!p.premium,
          owned: {
            frame: _extends({
              none: true
            }, p.owned && p.owned.frame),
            title: _extends({
              none: true
            }, p.owned && p.owned.title)
          }
        };
      }
      function setProfileName(state, name) {
        var n = String(name || '').trim();
        if (!n) return {
          ok: false,
          reason: '이름을 입력하세요'
        };
        if (n.length > PROFILE_NAME_MAX) return {
          ok: false,
          reason: "\uCD5C\uB300 " + PROFILE_NAME_MAX + "\uC790"
        };
        ensure(state).name = n;
        return {
          ok: true,
          name: n
        };
      }

      // 대표 영웅(아바타) — 보유 유닛만.
      function setAvatar(state, uid) {
        if (uid && !(state.units || []).some(function (u) {
          return u.uid === uid;
        })) return {
          ok: false,
          reason: '보유하지 않은 영웅'
        };
        ensure(state).avatarUid = uid || null;
        return {
          ok: true,
          avatarUid: uid || null
        };
      }
      function ownsCosmetic(state, kind, id) {
        if (id === 'none') return true;
        return !!(state.profile && state.profile.owned && state.profile.owned[kind] && state.profile.owned[kind][id]);
      }

      // 코스메틱 구매 — 다이아 소모. 능력치 없음.
      function buyCosmetic(state, kind, id) {
        var item = CATALOG[kind] && CATALOG[kind][id];
        if (!item) return {
          ok: false,
          reason: '없는 항목'
        };
        if (ownsCosmetic(state, kind, id)) return {
          ok: false,
          reason: '이미 보유'
        };
        if (item.cost && !spend(state.wallet, item.cost)) return {
          ok: false,
          reason: '다이아 부족',
          cost: item.cost
        };
        ensure(state).owned[kind][id] = true;
        return {
          ok: true,
          kind: kind,
          id: id,
          cost: item.cost || null
        };
      }

      // 장착 — 보유 항목만.
      function equipCosmetic(state, kind, id) {
        if (!(CATALOG[kind] && CATALOG[kind][id])) return {
          ok: false,
          reason: '없는 항목'
        };
        if (!ownsCosmetic(state, kind, id)) return {
          ok: false,
          reason: '미보유'
        };
        ensure(state)[kind] = id;
        return {
          ok: true,
          kind: kind,
          id: id
        };
      }

      // ── 광고제거 프리미엄 패스 ──────────────────────────────────
      // 광고 시청 없이도 광고 보상/오프라인 2배를 자동 지급받는 편의 상품.
      // 능력치·드롭률·확률에는 일절 관여하지 않는다.
      function hasPremium(state) {
        return !!(state.profile && state.profile.premium);
      }
      function grantPremium(state) {
        ensure(state).premium = true;
        return {
          ok: true
        };
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/costumes.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './stats.ts'], function (exports) {
  var _extends, _createForOfIteratorHelperLoose, cclegacy, computePower;
  return {
    setters: [function (module) {
      _extends = module.extends;
      _createForOfIteratorHelperLoose = module.createForOfIteratorHelperLoose;
    }, function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      computePower = module.computePower;
    }],
    execute: function () {
      exports({
        costumeFits: costumeFits,
        costumesFor: costumesFor,
        equipCostume: equipCostume,
        grantCostume: grantCostume,
        ownsCostume: ownsCostume,
        refreshCostumeUnlocks: refreshCostumeUnlocks,
        summonCostumePool: summonCostumePool,
        unequipCostume: unequipCostume,
        vipTier: vipTier
      });
      cclegacy._RF.push({}, "535bfa5WytLi4ibFIAsLdzd", "costumes", undefined);

      // ─────────────────────────────────────────────────────────────
      // 코스튬(스킨) — 캐릭터가 장착하는 순수 외형. 능력치 무관(비 P2W).
      //   · 계정이 코스튬을 "보유"하고, 캐릭터별로 "장착"한다(unit.skin).
      //   · char=null 은 범용(모든 영웅), char='kael' 등은 전용.
      //   · 획득 경로(source): 소환 / 퀘스트(스토리) / 과금등급(VIP) / 영웅전투력 / 속성전투력
      //     소환 외 경로는 조건 충족 시 자동 지급(refreshCostumeUnlocks).
      // 외형만 바꾸므로 stats/전투에는 전혀 관여하지 않는다.
      // ─────────────────────────────────────────────────────────────

      var COSTUMES = exports('COSTUMES', {
        // ── 소환 획득 ──
        CS_WANDERER: {
          id: 'CS_WANDERER',
          label: '방랑자 복장',
          emoji: '🧥',
          rarity: 'SR',
          "char": null,
          source: 'summon'
        },
        CS_FESTIVAL: {
          id: 'CS_FESTIVAL',
          label: '축제 의상',
          emoji: '🎎',
          rarity: 'SR',
          "char": null,
          source: 'summon'
        },
        CS_MIDNIGHT: {
          id: 'CS_MIDNIGHT',
          label: '심야 예복',
          emoji: '🌃',
          rarity: 'SSR',
          "char": null,
          source: 'summon'
        },
        // ── 퀘스트(스토리 진행) ──
        CS_KNIGHT: {
          id: 'CS_KNIGHT',
          label: '영웅의 갑주',
          emoji: '🛡️',
          rarity: 'SSR',
          "char": null,
          source: 'quest',
          need: {
            campaign: 5
          }
        },
        CS_KAEL_CRIMSON: {
          id: 'CS_KAEL_CRIMSON',
          label: '홍염 검성',
          emoji: '⚔️',
          rarity: 'UR',
          "char": 'kael',
          source: 'quest',
          need: {
            campaign: 8
          }
        },
        // ── 과금 등급(VIP) ──
        CS_ROYAL: {
          id: 'CS_ROYAL',
          label: '왕실 정장',
          emoji: '👑',
          rarity: 'SSR',
          "char": null,
          source: 'vip',
          need: {
            vip: 3
          }
        },
        CS_ARCHON: {
          id: 'CS_ARCHON',
          label: '집정관 예복',
          emoji: '🎩',
          rarity: 'UR',
          "char": null,
          source: 'vip',
          need: {
            vip: 6
          }
        },
        // ── 영웅 전투력(단일 영웅) ──
        CS_TITAN: {
          id: 'CS_TITAN',
          label: '거신 갑주',
          emoji: '🦾',
          rarity: 'SSR',
          "char": null,
          source: 'power',
          need: {
            power: 50000
          }
        },
        // ── 속성 전투력(해당 속성 합산) ──
        CS_INFERNO: {
          id: 'CS_INFERNO',
          label: '업화 예복',
          emoji: '🔥',
          rarity: 'SSR',
          "char": null,
          source: 'element',
          need: {
            element: 'FIRE',
            power: 30000
          }
        },
        CS_GLACIER: {
          id: 'CS_GLACIER',
          label: '빙하 예복',
          emoji: '🌊',
          rarity: 'SSR',
          "char": null,
          source: 'element',
          need: {
            element: 'WATER',
            power: 30000
          }
        },
        CS_VERDANT: {
          id: 'CS_VERDANT',
          label: '수림 예복',
          emoji: '🌿',
          rarity: 'SSR',
          "char": null,
          source: 'element',
          need: {
            element: 'WOOD',
            power: 30000
          }
        },
        CS_RADIANT: {
          id: 'CS_RADIANT',
          label: '광휘 예복',
          emoji: '✨',
          rarity: 'SSR',
          "char": null,
          source: 'element',
          need: {
            element: 'LIGHT',
            power: 30000
          }
        },
        CS_UMBRAL: {
          id: 'CS_UMBRAL',
          label: '심연 예복',
          emoji: '🌑',
          rarity: 'SSR',
          "char": null,
          source: 'element',
          need: {
            element: 'DARK',
            power: 30000
          }
        }
      });
      var SOURCE_LABEL = exports('SOURCE_LABEL', {
        summon: '코스튬 소환',
        quest: '스토리 퀘스트',
        vip: '과금 등급',
        power: '영웅 전투력',
        element: '속성 전투력'
      });

      // 과금 등급(VIP) — 누적 결제액(원) 기준 티어.
      var VIP_THRESHOLDS = exports('VIP_THRESHOLDS', [0, 5000, 15000, 30000, 60000, 120000, 250000]);
      function vipTier(state) {
        var spend = state.vip && state.vip.spend || 0;
        var t = 0;
        for (var i = 0; i < VIP_THRESHOLDS.length; i++) if (spend >= VIP_THRESHOLDS[i]) t = i;
        return t;
      }
      function ensure(state) {
        state.costumes = state.costumes || {
          owned: {}
        };
        state.costumes.owned = state.costumes.owned || {};
        return state.costumes;
      }
      function ownsCostume(state, id) {
        return !!(state.costumes && state.costumes.owned && state.costumes.owned[id]);
      }
      function grantCostume(state, id) {
        if (!COSTUMES[id]) return {
          ok: false,
          reason: '없는 코스튬'
        };
        var first = !ownsCostume(state, id);
        ensure(state).owned[id] = true;
        return {
          ok: true,
          id: id,
          first: first
        };
      }

      // 코스튬이 이 유닛에 맞는가(범용 또는 전용 일치).
      function costumeFits(costume, unit) {
        if (!costume) return false;
        return costume["char"] == null || costume["char"] === unit.characterId;
      }

      // 장착 — 보유 + 적합 시 unit.skin 설정(순수 외형).
      function equipCostume(state, unit, id) {
        var c = COSTUMES[id];
        if (!c) return {
          ok: false,
          reason: '없는 코스튬'
        };
        if (!ownsCostume(state, id)) return {
          ok: false,
          reason: '미보유'
        };
        if (!costumeFits(c, unit)) return {
          ok: false,
          reason: '이 영웅은 착용 불가'
        };
        unit.skin = id;
        return {
          ok: true,
          id: id
        };
      }
      function unequipCostume(unit) {
        unit.skin = null;
        return {
          ok: true
        };
      }

      // 유닛이 착용 가능한 코스튬 목록(범용+전용) + 보유/장착/획득경로.
      function costumesFor(state, unit) {
        return Object.values(COSTUMES).filter(function (c) {
          return costumeFits(c, unit);
        }).map(function (c) {
          return _extends({}, c, {
            owned: ownsCostume(state, c.id),
            equipped: unit.skin === c.id,
            sourceLabel: SOURCE_LABEL[c.source] || c.source
          });
        });
      }

      // 속성별 전투력 합산.
      function elementPower(state, element) {
        var sum = 0;
        for (var _iterator = _createForOfIteratorHelperLoose(state.units || []), _step; !(_step = _iterator()).done;) {
          var u = _step.value;
          if (u.element === element) sum += computePower(u);
        }
        return sum;
      }
      // 최고 단일 영웅 전투력.
      function bestHeroPower(state) {
        var best = 0;
        for (var _iterator2 = _createForOfIteratorHelperLoose(state.units || []), _step2; !(_step2 = _iterator2()).done;) {
          var u = _step2.value;
          best = Math.max(best, computePower(u));
        }
        return best;
      }

      // 조건 충족 코스튬 자동 지급(소환 제외). 반환 { granted: [id...] }.
      function refreshCostumeUnlocks(state) {
        var granted = [];
        var campaign = state.campaign && state.campaign.cleared || 0;
        var vip = vipTier(state);
        for (var _i = 0, _Object$values = Object.values(COSTUMES); _i < _Object$values.length; _i++) {
          var c = _Object$values[_i];
          if (c.source === 'summon' || ownsCostume(state, c.id)) continue;
          var n = c.need || {};
          var ok = false;
          if (c.source === 'quest') ok = campaign >= (n.campaign || 0);else if (c.source === 'vip') ok = vip >= (n.vip || 0);else if (c.source === 'power') ok = bestHeroPower(state) >= (n.power || 0);else if (c.source === 'element') ok = elementPower(state, n.element) >= (n.power || 0);
          if (ok) {
            grantCostume(state, c.id);
            granted.push(c.id);
          }
        }
        return {
          granted: granted
        };
      }

      // 소환용 미보유 코스튬 풀(소환 획득분).
      function summonCostumePool(state) {
        return Object.values(COSTUMES).filter(function (c) {
          return c.source === 'summon' && !ownsCostume(state, c.id);
        });
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/daily.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './economy.ts', './progression.ts', './gear.ts', './runes.ts', './materials.ts', './rng.ts'], function (exports) {
  var _extends, _createForOfIteratorHelperLoose, cclegacy, earn, getStage, dropGear, dropRune, addMaterial, weightedPick;
  return {
    setters: [function (module) {
      _extends = module.extends;
      _createForOfIteratorHelperLoose = module.createForOfIteratorHelperLoose;
    }, function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      earn = module.earn;
    }, function (module) {
      getStage = module.getStage;
    }, function (module) {
      dropGear = module.dropGear;
    }, function (module) {
      dropRune = module.dropRune;
    }, function (module) {
      addMaterial = module.addMaterial;
    }, function (module) {
      weightedPick = module.weightedPick;
    }],
    execute: function () {
      exports({
        canClaimAttendance: canClaimAttendance,
        claimAllDaily: claimAllDaily,
        claimAttendance: claimAttendance,
        claimMission: claimMission,
        dungeonEntriesLeft: dungeonEntriesLeft,
        enterDungeon: enterDungeon,
        epochDay: epochDay,
        missionList: missionList,
        recordMission: recordMission,
        refreshDaily: refreshDaily,
        sweepDungeon: sweepDungeon
      });
      cclegacy._RF.push({}, "80059SLJ4NHYbR7GuDl4QB6", "daily", undefined);

      // ─────────────────────────────────────────────────────────────
      // 일일 콘텐츠 — 출석 · 일일 미션 · 던전. (장르/컨셉 무관)
      // 자원 faucet: 특히 소환권(summon)을 공급해 수집 루프를 돌린다.
      // 하루 경계는 UTC epoch-day 기준.
      // ─────────────────────────────────────────────────────────────

      function epochDay(now) {
        if (now === void 0) {
          now = Date.now();
        }
        return Math.floor(now / 86400000);
      }

      // 출석 7일 순환 보상
      var ATTENDANCE = exports('ATTENDANCE', [{
        currency: 500
      }, {
        growth: 300
      }, {
        summon: 20
      }, {
        currency: 1000
      }, {
        growth: 600
      }, {
        summon: 30
      }, {
        summon: 60
      }]);

      // 일일 미션
      var MISSIONS = exports('MISSIONS', [{
        id: 'summon',
        label: '소환 1회',
        goal: 1,
        reward: {
          growth: 300
        }
      }, {
        id: 'upgrade',
        label: '캐릭터 강화 5회',
        goal: 5,
        reward: {
          summon: 20
        }
      }, {
        id: 'dungeon',
        label: '던전 3회',
        goal: 3,
        reward: {
          currency: 800
        }
      }]);

      // 던전: 자원/아이템 파밍. 하루 입장 제한.
      //   kind 'resource' → 재화 대량 지급 · 'gear'/'rune' → 실제 아이템 드롭.
      var DUNGEONS = exports('DUNGEONS', {
        GOLD: {
          kind: 'resource',
          resource: 'currency',
          entriesPerDay: 3
        },
        ESSENCE: {
          kind: 'resource',
          resource: 'growth',
          entriesPerDay: 3
        },
        GEAR: {
          kind: 'gear',
          entriesPerDay: 2
        },
        RUNE: {
          kind: 'rune',
          entriesPerDay: 2
        },
        // ── 재료 던전 ──
        WEEKDAY: {
          kind: 'weekday',
          entriesPerDay: 2
        },
        // 장비/악세 + 돌파석
        ELEMENT: {
          kind: 'element',
          entriesPerDay: 2
        },
        // 속성정수 (장비 속성 옵션)
        PETSHARD: {
          kind: 'petshard',
          entriesPerDay: 2
        } // 펫조각 (등급별)
      });

      // 펫조각 등급 확률 (진행도 luck으로 상위 가중).
      function rollShardGrade(rng, luck) {
        return weightedPick([{
          id: 'R',
          weight: 60
        }, {
          id: 'SR',
          weight: 25 * (1 + luck)
        }, {
          id: 'SSR',
          weight: 10 * (1 + luck * 2)
        }, {
          id: 'UR',
          weight: 3 * (1 + luck * 4)
        }], rng).id;
      }

      // 진행도(peakStage) → 상위 등급 드롭 확률 luck(0~1).
      function dropLuck(state) {
        return Math.min(1, (state.peakStage || 1) / 200);
      }

      // 하루가 바뀌면 미션/던전 초기화 (출석 streak은 유지).
      function refreshDaily(state, now) {
        if (now === void 0) {
          now = Date.now();
        }
        var d = epochDay(now);
        var dl = state.daily;
        if (dl.epochDay !== d) {
          dl.epochDay = d;
          dl.missions = {
            summon: 0,
            upgrade: 0,
            dungeon: 0
          };
          dl.claimed = {};
          dl.dungeon = Object.fromEntries(Object.keys(DUNGEONS).map(function (k) {
            return [k, 0];
          }));
        }
      }

      // ── 출석 ──────────────────────────────────────────────────────
      function canClaimAttendance(state, now) {
        if (now === void 0) {
          now = Date.now();
        }
        refreshDaily(state, now);
        return state.daily.claimedDay !== epochDay(now);
      }
      function claimAttendance(state, now) {
        if (now === void 0) {
          now = Date.now();
        }
        if (!canClaimAttendance(state, now)) return {
          ok: false,
          reason: '오늘 이미 수령'
        };
        var idx = state.daily.streak % ATTENDANCE.length;
        var reward = ATTENDANCE[idx];
        earn(state.wallet, reward);
        state.daily.streak += 1;
        state.daily.claimedDay = epochDay(now);
        return {
          ok: true,
          reward: reward,
          day: idx + 1,
          streak: state.daily.streak
        };
      }

      // ── 미션 ──────────────────────────────────────────────────────
      function recordMission(state, key, n, now) {
        if (n === void 0) {
          n = 1;
        }
        if (now === void 0) {
          now = Date.now();
        }
        refreshDaily(state, now);
        state.daily.missions[key] = (state.daily.missions[key] || 0) + n;
      }
      function missionList(state, now) {
        if (now === void 0) {
          now = Date.now();
        }
        refreshDaily(state, now);
        return MISSIONS.map(function (m) {
          var progress = Math.min(state.daily.missions[m.id] || 0, m.goal);
          var claimed = !!state.daily.claimed[m.id];
          return _extends({}, m, {
            progress: progress,
            done: progress >= m.goal,
            claimed: claimed
          });
        });
      }
      function claimMission(state, id) {
        var m = MISSIONS.find(function (x) {
          return x.id === id;
        });
        if (!m) return {
          ok: false
        };
        var progress = state.daily.missions[m.id] || 0;
        if (progress < m.goal) return {
          ok: false,
          reason: '미완료'
        };
        if (state.daily.claimed[m.id]) return {
          ok: false,
          reason: '이미 수령'
        };
        earn(state.wallet, m.reward);
        state.daily.claimed[m.id] = true;
        return {
          ok: true,
          reward: m.reward
        };
      }

      // ── 던전 ──────────────────────────────────────────────────────
      function dungeonEntriesLeft(state, type, now) {
        if (now === void 0) {
          now = Date.now();
        }
        refreshDaily(state, now);
        return DUNGEONS[type].entriesPerDay - (state.daily.dungeon[type] || 0);
      }
      function enterDungeon(state, type, now, rng) {
        var _earn;
        if (now === void 0) {
          now = Date.now();
        }
        if (rng === void 0) {
          rng = Math.random;
        }
        if (dungeonEntriesLeft(state, type, now) <= 0) return {
          ok: false,
          reason: '입장 횟수 소진'
        };
        var d = DUNGEONS[type];
        state.daily.dungeon[type] = (state.daily.dungeon[type] || 0) + 1;
        recordMission(state, 'dungeon', 1, now);
        if (d.kind === 'gear') {
          var r = dropGear(state, rng, dropLuck(state));
          return {
            ok: true,
            kind: 'gear',
            item: r.item,
            rarity: r.rarity
          };
        }
        if (d.kind === 'rune') {
          var _r = dropRune(state, rng, dropLuck(state));
          return {
            ok: true,
            kind: 'rune',
            rune: _r.rune,
            rarity: _r.rarity
          };
        }
        if (d.kind === 'weekday') {
          // 장비 1점 + 소환석(진행도 비례) — 돌파 재료가 소환석으로 통합됨.
          var g = dropGear(state, rng, dropLuck(state));
          var summonAmt = 10 + Math.floor((state.peakStage || 1) / 10);
          earn(state.wallet, {
            summon: summonAmt
          });
          return {
            ok: true,
            kind: 'weekday',
            item: g.item,
            rarity: g.rarity,
            summon: summonAmt
          };
        }
        if (d.kind === 'element') {
          var _amount = 3 + Math.floor((state.peakStage || 1) / 25);
          addMaterial(state, 'elemEssence', _amount);
          return {
            ok: true,
            kind: 'element',
            elemEssence: _amount
          };
        }
        if (d.kind === 'petshard') {
          var grade = rollShardGrade(rng, dropLuck(state));
          var _amount2 = 4 + Math.floor((state.peakStage || 1) / 20);
          addMaterial(state, 'petShard', _amount2, grade);
          return {
            ok: true,
            kind: 'petshard',
            grade: grade,
            amount: _amount2
          };
        }
        // 자원 던전: 즉시 대량 보상 (진행도 보상 × 40)
        var res = d.resource;
        var amount = Math.round(getStage(state.peakStage).rewards[res] * 40);
        earn(state.wallet, (_earn = {}, _earn[res] = amount, _earn));
        return {
          ok: true,
          kind: 'resource',
          amount: amount,
          resource: res
        };
      }

      // ── QoL: 소탕(sweep) — 남은 입장 횟수를 한 번에 소진하고 보상 합산. ──
      function sweepDungeon(state, type, now, rng) {
        if (now === void 0) {
          now = Date.now();
        }
        if (rng === void 0) {
          rng = Math.random;
        }
        var left = dungeonEntriesLeft(state, type, now);
        if (left <= 0) return {
          ok: false,
          reason: '입장 횟수 소진'
        };
        var acc = {
          count: 0,
          elemEssence: 0,
          items: 0,
          runes: 0,
          shards: {},
          currency: 0,
          growth: 0,
          summon: 0
        };
        var last = null;
        for (var i = 0; i < left; i++) {
          var r = enterDungeon(state, type, now, rng);
          if (!r.ok) break;
          last = r;
          acc.count++;
          acc.elemEssence += r.elemEssence || 0;
          acc.summon += r.summon || 0;
          if (r.kind === 'petshard') acc.shards[r.grade] = (acc.shards[r.grade] || 0) + (r.amount || 0);else if (r.kind === 'resource') acc[r.resource] = (acc[r.resource] || 0) + (r.amount || 0);else if (r.kind === 'gear' || r.kind === 'weekday') acc.items++;else if (r.kind === 'rune') acc.runes++;
        }
        return _extends({
          ok: acc.count > 0,
          kind: DUNGEONS[type].kind
        }, acc, {
          last: last
        });
      }

      // ── QoL: 원탭 일일 전체수령 — 출석 + 완료 미션 일괄 수령. ──
      function claimAllDaily(state, now) {
        if (now === void 0) {
          now = Date.now();
        }
        var got = {
          attendance: null,
          missions: []
        };
        if (canClaimAttendance(state, now)) {
          var a = claimAttendance(state, now);
          if (a.ok) got.attendance = a.reward;
        }
        for (var _iterator = _createForOfIteratorHelperLoose(missionList(state, now)), _step; !(_step = _iterator()).done;) {
          var m = _step.value;
          if (m.done && !m.claimed) {
            var r = claimMission(state, m.id);
            if (r.ok) got.missions.push({
              id: m.id,
              reward: r.reward
            });
          }
        }
        return _extends({
          ok: !!got.attendance || got.missions.length > 0
        }, got);
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/difficulty.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './progression.ts'], function (exports) {
  var _extends, cclegacy, getStage;
  return {
    setters: [function (module) {
      _extends = module.extends;
    }, function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      getStage = module.getStage;
    }],
    execute: function () {
      exports({
        difficultyDef: difficultyDef,
        difficultyUnlocked: difficultyUnlocked,
        playStage: playStage,
        setDifficulty: setDifficulty
      });
      cclegacy._RF.push({}, "eedd25M9lVCy7u5KF1QLdK4", "difficulty", undefined);

      // ─────────────────────────────────────────────────────────────
      // 스테이지 난이도 티어 — 방치 진행에 적·보상 배수를 건다.
      //   · 상위 난이도일수록 적이 강해지지만 보상 배수도 크다(고위험·고보상).
      //   · 역대 최고 층(peakStage)로 해금.
      //   · 방치 진행은 선택 난이도에서 "이길 수 있는 최심 층"으로 자동 정착한다
      //     (idle.tick이 하강/전진으로 조정) → 어떤 난이도든 파밍이 성립.
      // ─────────────────────────────────────────────────────────────
      // 배수 설계: 적 배수는 완만, 보상 배수는 넉넉하게 → 스테이지가 조금 내려가도
      // 순수입은 늘어(감당 가능한 유저에게 명확한 이득). 상위 난이도일수록 순이득↑.
      // 시뮬로 튜닝: 적 배수(완만)보다 보상 배수를 크게 잡아, 감당 가능한 유저는
      // 상위 난이도일수록 시간당 순수입이 확실히 는다(일반 대비 험난 ~2.2×, 나락 ~2.5×).
      // eva=적 회피(우리 명중으로 상쇄) · acc=적 명중(우리 회피를 상쇄). 상위 난이도일수록↑.
      var DIFFICULTIES = exports('DIFFICULTIES', [{
        id: 'normal',
        label: '일반',
        emoji: '🟢',
        enemyMult: 1,
        rewardMult: 1,
        unlock: 1,
        eva: 0,
        acc: 0
      }, {
        id: 'hard',
        label: '험난',
        emoji: '🟡',
        enemyMult: 2,
        rewardMult: 8,
        unlock: 30,
        eva: 0.15,
        acc: 0.10
      }, {
        id: 'hell',
        label: '지옥',
        emoji: '🔴',
        enemyMult: 4,
        rewardMult: 40,
        unlock: 60,
        eva: 0.25,
        acc: 0.20
      }, {
        id: 'abyss',
        label: '나락',
        emoji: '🟣',
        enemyMult: 8,
        rewardMult: 200,
        unlock: 100,
        eva: 0.35,
        acc: 0.30
      }]);
      function difficultyDef(id) {
        return DIFFICULTIES.find(function (d) {
          return d.id === id;
        }) || DIFFICULTIES[0];
      }
      function difficultyUnlocked(state, id) {
        return (state.peakStage || 1) >= difficultyDef(id).unlock;
      }

      // 난이도 배수를 반영한 스테이지 (방치 진행 전용). getStage에 배수만 곱한다.
      function playStage(state, stage) {
        if (stage === void 0) {
          stage = state.stage;
        }
        var base = getStage(stage);
        var d = difficultyDef(state.difficulty || 'normal');
        return _extends({}, base, {
          challenge: _extends({}, base.challenge, {
            hp: Math.round(base.challenge.hp * d.enemyMult),
            atk: Math.round(base.challenge.atk * d.enemyMult),
            def: Math.round(base.challenge.def * d.enemyMult),
            eva: d.eva || 0,
            // 적 회피 → 우리 명중으로 상쇄
            acc: d.acc || 0 // 적 명중 → 우리 회피를 상쇄
          }),

          rewards: {
            currency: Math.round(base.rewards.currency * d.rewardMult),
            growth: Math.round(base.rewards.growth * d.rewardMult)
          },
          difficulty: d
        });
      }

      // 난이도 변경 (해금 검사). 방치 진행은 다음 틱에 자동 재정착.
      function setDifficulty(state, id) {
        if (!difficultyUnlocked(state, id)) return {
          ok: false,
          reason: '미해금 난이도'
        };
        state.difficulty = id;
        return {
          ok: true,
          difficulty: id
        };
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/dismantle.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './economy.ts', './units.ts', './skills.ts', './enhance.ts', './character.ts', './gear.ts'], function (exports) {
  var _createForOfIteratorHelperLoose, cclegacy, earn, levelUpCost, skillUpCost, awakenCost, enhanceCost, ascendCost, GEAR_SLOTS;
  return {
    setters: [function (module) {
      _createForOfIteratorHelperLoose = module.createForOfIteratorHelperLoose;
    }, function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      earn = module.earn;
    }, function (module) {
      levelUpCost = module.levelUpCost;
    }, function (module) {
      skillUpCost = module.skillUpCost;
      awakenCost = module.awakenCost;
    }, function (module) {
      enhanceCost = module.enhanceCost;
    }, function (module) {
      ascendCost = module.ascendCost;
    }, function (module) {
      GEAR_SLOTS = module.GEAR_SLOTS;
    }],
    execute: function () {
      exports({
        dismantlePreview: dismantlePreview,
        dismantleUnit: dismantleUnit,
        invested: invested
      });
      cclegacy._RF.push({}, "49f8cK48l1Ch73IP5MtNIj3", "dismantle", undefined);

      // ─────────────────────────────────────────────────────────────
      // 100% 자원 환급(분해) — 신캐 육성 스트레스 제거(피로도 제로).
      //   · 유닛에 투자한 성장/돌파/스킬/각인/각성 자원을 "전액" 반환한다.
      //   · 장착 장비는 소실 없이 인벤토리로 회수(장비는 자체 인스턴스라 별도 자산).
      //   · 최소 1명·파티원 보호: 마지막 유닛 또는 편성 중 유닛은 분해 불가.
      // 재료 소모 없이 100% 회수 → "새 캐릭 뽑아도 부담 없다"는 신뢰를 준다.
      // ─────────────────────────────────────────────────────────────

      // 유닛에 누적 투자된 자원 총량을 재구성한다(비용식 역산 — 별도 원장 불필요).
      function invested(unit) {
        var bag = {
          growth: 0,
          currency: 0,
          summon: 0,
          gem: 0
        };
        // 레벨업(growth): 1→현재 레벨까지 각 단계 비용 합.
        for (var L = 1; L < (unit.level || 1); L++) {
          bag.growth += levelUpCost({
            level: L
          }).growth;
        }
        // 돌파(소환석): 랭크 1→현재까지 각 단계 비용 합(중복 소모로 돌파한 경우는 환급 대상 아님).
        for (var r = 1; r < (unit.rank || 1); r++) bag.summon += ascendCost({
          rank: r
        }).summon;
        // 스킬 강화(growth): 각 스킬 레벨 1→현재.
        for (var _iterator = _createForOfIteratorHelperLoose(unit.skills || []), _step; !(_step = _iterator()).done;) {
          var s = _step.value;
          if (!s || !s.id) continue;
          for (var lv = 1; lv < (s.level || 1); lv++) bag.growth += skillUpCost(lv).growth;
        }
        // 각인(currency): 노드별 0→현재.
        for (var _i = 0, _Object$keys = Object.keys(unit.enhance || {}); _i < _Object$keys.length; _i++) {
          var stat = _Object$keys[_i];
          var cur = unit.enhance[stat] || 0;
          for (var c = 0; c < cur; c++) bag.currency += enhanceCost(c).currency;
        }
        // 시그니처 각성(summon+gem): 0→현재.
        for (var a = 0; a < (unit.sigAwaken || 0); a++) {
          var _c = awakenCost(a);
          bag.summon += _c.summon;
          bag.gem += _c.gem;
        }
        return bag;
      }

      // 분해 미리보기(확인 다이얼로그용): 반환량 + 회수 장비 수.
      function dismantlePreview(state, uid) {
        var unit = (state.units || []).find(function (u) {
          return u.uid === uid;
        });
        if (!unit) return {
          ok: false,
          reason: '유닛 없음'
        };
        var refund = invested(unit);
        var gearBack = GEAR_SLOTS.filter(function (s) {
          return unit.gear && unit.gear[s];
        }).length;
        return {
          ok: true,
          refund: refund,
          gearBack: gearBack
        };
      }

      // 실제 분해 실행: 자원 환급 + 장비 회수 + 유닛 제거.
      function dismantleUnit(state, uid) {
        var units = state.units || [];
        if (units.length <= 1) return {
          ok: false,
          reason: '마지막 유닛은 분해 불가'
        };
        if ((state.party || []).includes(uid)) return {
          ok: false,
          reason: '편성 중인 유닛은 분해 불가(먼저 편성 해제)'
        };
        var unit = units.find(function (u) {
          return u.uid === uid;
        });
        if (!unit) return {
          ok: false,
          reason: '유닛 없음'
        };
        var refund = invested(unit);
        // 지갑 자원(growth/currency/summon/gem) 환급.
        earn(state.wallet, {
          growth: refund.growth,
          currency: refund.currency,
          summon: refund.summon,
          gem: refund.gem
        });
        // 장착 장비 인벤토리로 회수(소실 없음).
        var gearBack = 0;
        for (var _iterator2 = _createForOfIteratorHelperLoose(GEAR_SLOTS), _step2; !(_step2 = _iterator2()).done;) {
          var slot = _step2.value;
          var item = unit.gear && unit.gear[slot];
          if (item) {
            state.inventory.push(item);
            unit.gear[slot] = null;
            gearBack += 1;
          }
        }
        // 유닛 제거 + 진형/아바타 등 참조 정리.
        state.units = units.filter(function (u) {
          return u.uid !== uid;
        });
        if (state.formation) delete state.formation[uid];
        if (state.profile && state.profile.avatarUid === uid) state.profile.avatarUid = null;
        return {
          ok: true,
          refund: refund,
          gearBack: gearBack
        };
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/economy.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc'], function (exports) {
  var _extends, cclegacy;
  return {
    setters: [function (module) {
      _extends = module.extends;
    }, function (module) {
      cclegacy = module.cclegacy;
    }],
    execute: function () {
      exports({
        createWallet: createWallet,
        earn: earn,
        spend: spend
      });
      cclegacy._RF.push({}, "393c22TXS1LR5ymth1/9ZyG", "economy", undefined);
      // ─────────────────────────────────────────────────────────────
      // 자원/경제 — 장르/컨셉 무관.
      // 자원은 추상 키로만 다룬다:
      //   currency : 소프트 재화 (컨셉에서 골드/크레딧 등으로 표시)
      //   growth   : 성장 재료 (레벨업에 소모)
      //   summon   : 소환 재화 (신규 유닛 획득)
      //   gem      : 프리미엄 재화 (BM/상점 — 다이아 등)
      // ─────────────────────────────────────────────────────────────

      function createWallet(init) {
        if (init === void 0) {
          init = {};
        }
        return _extends({
          currency: 0,
          growth: 0,
          summon: 0,
          gem: 0
        }, init);
      }
      function earn(wallet, gains) {
        for (var _i = 0, _Object$entries = Object.entries(gains); _i < _Object$entries.length; _i++) {
          var _Object$entries$_i = _Object$entries[_i],
            k = _Object$entries$_i[0],
            v = _Object$entries$_i[1];
          wallet[k] = (wallet[k] || 0) + v;
        }
        return wallet;
      }

      // 비용을 지불할 수 있으면 차감하고 true, 아니면 false.
      function spend(wallet, cost) {
        for (var _i2 = 0, _arr = Object.entries(cost); _i2 < _arr.length; _i2++) {
          var _arr$_i = _arr[_i2],
            k = _arr$_i[0],
            v = _arr$_i[1];
          if ((wallet[k] || 0) < v) return false;
        }
        for (var _i3 = 0, _arr2 = Object.entries(cost); _i3 < _arr2.length; _i3++) {
          var _arr2$_i = _arr2[_i3],
            _k = _arr2$_i[0],
            _v = _arr2$_i[1];
          wallet[_k] -= _v;
        }
        return true;
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/elements.ts", ['cc', './features.ts'], function (exports) {
  var cclegacy, isOn;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      isOn = module.isOn;
    }],
    execute: function () {
      exports({
        affinity: affinity,
        affinityLabel: affinityLabel
      });
      cclegacy._RF.push({}, "0063eNVgRRC9IVhuOx8b/Y5", "elements", undefined);
      var ELEMENTS = exports('ELEMENTS', ['FIRE', 'WATER', 'WOOD', 'LIGHT', 'DARK']);

      // key가 value를 이긴다.
      var BEATS = {
        FIRE: 'WOOD',
        WOOD: 'WATER',
        WATER: 'FIRE',
        LIGHT: 'DARK',
        DARK: 'LIGHT'
      };
      var ADVANTAGE = 1.3; // 유리 시 피해 배수
      var DISADVANTAGE = 0.8; // 불리 시 피해 배수

      // 공격자 속성이 방어자 속성에 대해 갖는 피해 배수.
      function affinity(atk, def) {
        if (!isOn('elements')) return 1; // 속성 옵션 off → 상성 무관(스탯 전용)
        if (!atk || !def) return 1; // 속성 없으면 무관
        if (BEATS[atk] === def) return ADVANTAGE;
        if (BEATS[def] === atk) return DISADVANTAGE;
        return 1;
      }
      function affinityLabel(atk, def) {
        var m = affinity(atk, def);
        return m > 1 ? '유리' : m < 1 ? '불리' : '무관';
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/emblems.ts", ['cc', './economy.ts'], function (exports) {
  var cclegacy, spend;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      spend = module.spend;
    }],
    execute: function () {
      exports({
        emblemCap: emblemCap,
        emblemComplete: emblemComplete,
        emblemMods: emblemMods,
        emblemUpgradeCost: emblemUpgradeCost,
        upgradeEmblem: upgradeEmblem
      });
      cclegacy._RF.push({}, "865fdiI9A5LrISrGqDLw03T", "emblems", undefined);

      // ─────────────────────────────────────────────────────────────
      // 엠블럼(문장) — 계정 단위 수집형 성장. 유물과 형제지만 축이 다르다.
      //   · 유물: currency(성장 재화)로 강화
      //   · 엠블럼: 다이아(gem)로 강화 → 프리미엄 재화 싱크
      //   전 유닛 공유 배수(power/currency/growth)를 accountMods에 합산한다.
      //   전 문장을 1레벨 이상 수집하면 "도감 완성" 파워 보너스가 붙는다.
      // ─────────────────────────────────────────────────────────────

      var EMBLEMS = exports('EMBLEMS', {
        E_VALOR: {
          id: 'E_VALOR',
          kind: 'power',
          per: 0.04,
          rarity: 'R',
          emoji: '🎖️',
          label: '용맹의 문장'
        },
        E_FORTUNE: {
          id: 'E_FORTUNE',
          kind: 'currency',
          per: 0.06,
          rarity: 'R',
          emoji: '🏅',
          label: '행운의 문장'
        },
        E_WISDOM: {
          id: 'E_WISDOM',
          kind: 'growth',
          per: 0.06,
          rarity: 'R',
          emoji: '🎗️',
          label: '지혜의 문장'
        },
        E_CONQUEST: {
          id: 'E_CONQUEST',
          kind: 'power',
          per: 0.06,
          rarity: 'SR',
          emoji: '🥇',
          label: '정복의 문장'
        },
        E_ETERNITY: {
          id: 'E_ETERNITY',
          kind: 'power',
          per: 0.09,
          rarity: 'SSR',
          emoji: '👑',
          label: '영원의 문장'
        }
      });
      var EMBLEM_RARITY_CAP = exports('EMBLEM_RARITY_CAP', {
        R: 15,
        SR: 25,
        SSR: 35
      });
      function emblemCap(id) {
        var e = EMBLEMS[id];
        return e && EMBLEM_RARITY_CAP[e.rarity] || 15;
      }

      // 도감 완성(전 문장 1레벨↑) 시 파워 보너스.
      var EMBLEM_COMPLETE_BONUS = exports('EMBLEM_COMPLETE_BONUS', 0.10);
      function emblemUpgradeCost(level) {
        return {
          gem: Math.round(20 * Math.pow(1.35, level))
        };
      }
      function upgradeEmblem(state, id) {
        if (!EMBLEMS[id]) return {
          ok: false,
          reason: '알 수 없는 문장'
        };
        var cap = emblemCap(id);
        var lv = state.emblems && state.emblems[id] || 0;
        if (lv >= cap) return {
          ok: false,
          reason: "\uAC15\uD654 \uC0C1\uD55C " + cap
        };
        var cost = emblemUpgradeCost(lv);
        if (!spend(state.wallet, cost)) return {
          ok: false,
          reason: '다이아 부족',
          cost: cost
        };
        state.emblems = state.emblems || {};
        state.emblems[id] = lv + 1;
        return {
          ok: true,
          id: id,
          level: lv + 1,
          cost: cost
        };
      }

      // 도감 완성 여부(전 문장 1레벨 이상).
      function emblemComplete(state) {
        var owned = state.emblems || {};
        return Object.keys(EMBLEMS).every(function (id) {
          return (owned[id] || 0) >= 1;
        });
      }

      // 계정 배수 (power / currency / growth). 문장 없으면 전부 1. 완성 시 파워 보너스.
      function emblemMods(state) {
        var power = 1,
          currency = 1,
          growth = 1;
        var owned = state.emblems || {};
        for (var _i = 0, _arr = Object.entries(owned); _i < _arr.length; _i++) {
          var _arr$_i = _arr[_i],
            id = _arr$_i[0],
            lv = _arr$_i[1];
          var e = EMBLEMS[id];
          if (!e || !lv) continue;
          if (e.kind === 'power') power += e.per * lv;else if (e.kind === 'currency') currency += e.per * lv;else growth += e.per * lv;
        }
        if (emblemComplete(state)) power += EMBLEM_COMPLETE_BONUS;
        return {
          power: power,
          currency: currency,
          growth: growth
        };
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/enhance.ts", ['cc', './balance.ts'], function (exports) {
  var cclegacy, BALANCE;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      BALANCE = module.BALANCE;
    }],
    execute: function () {
      exports({
        createEnhance: createEnhance,
        enhanceCost: enhanceCost,
        getEnhanceNode: getEnhanceNode
      });
      cclegacy._RF.push({}, "1c693BpqDZEeIBLvBSCaWi9", "enhance", undefined);
      var ENHANCE_NODES = exports('ENHANCE_NODES', {
        atk: {
          kind: 'statPct',
          stat: 'atk',
          per: 0.04,
          label: '공격 각인'
        },
        hp: {
          kind: 'statPct',
          stat: 'hp',
          per: 0.04,
          label: '체력 각인'
        },
        def: {
          kind: 'statPct',
          stat: 'def',
          per: 0.05,
          label: '방어 각인'
        },
        crit: {
          kind: 'effect',
          stat: 'critChance',
          per: 0.02,
          label: '치명 각인'
        }
      });
      var ENHANCE_CAP = exports('ENHANCE_CAP', 10); // 노드당 최대 강화 레벨

      function getEnhanceNode(stat) {
        var n = ENHANCE_NODES[stat];
        if (!n) throw new Error("\uC54C \uC218 \uC5C6\uB294 \uAC15\uD654 \uB178\uB4DC: " + stat);
        return n;
      }

      // 다음 강화 비용(currency). 레벨이 오를수록 급증.
      function enhanceCost(currentLevel) {
        return {
          currency: Math.round(BALANCE.enhanceCostBase * Math.pow(BALANCE.enhanceCostGrowth, currentLevel))
        };
      }

      // 유닛의 빈 강화 상태 생성.
      function createEnhance() {
        return {
          atk: 0,
          hp: 0,
          def: 0,
          crit: 0
        };
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/events.ts", ['cc', './economy.ts'], function (exports) {
  var cclegacy, earn;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      earn = module.earn;
    }],
    execute: function () {
      exports({
        claimWeekly: claimWeekly,
        currentTheme: currentTheme,
        recordEvent: recordEvent,
        weekIndex: weekIndex,
        weeklyEvent: weeklyEvent
      });
      cclegacy._RF.push({}, "18464CmGHVBEJbW6SVc2+G/", "events", undefined);

      // ─────────────────────────────────────────────────────────────
      // 상시 순환형 '미니 로드맵' 주간 테마 이벤트.
      //   · 매주(UTC epoch-week) 테마가 바뀌며 자연스럽게 서브 재화를 퍼준다.
      //   · "이번 주는 무엇에 집중하면 이득"이라는 방향을 주어 정체감을 없앤다.
      //   · 로컬 완결(서버 불요): 주기 경계에서 진행도 리셋 + 1회 보상 청구.
      // ─────────────────────────────────────────────────────────────

      var WEEK_MS = 7 * 86400000;
      function weekIndex(now) {
        if (now === void 0) {
          now = Date.now();
        }
        return Math.floor(now / WEEK_MS);
      }

      // 테마: track(집계 대상 행동) 달성 → 보상 상자 1회.
      //   track 키는 daily/arena에서 발생하는 행동과 동일하게 recordEvent로 적립.
      var WEEKLY_THEMES = exports('WEEKLY_THEMES', [{
        id: 'skill',
        label: '스킬 성장의 주',
        emoji: '📘',
        track: 'upgrade',
        goal: 30,
        hint: '캐릭터/스킬 강화가 이득! 강화 30회 달성 상자.',
        reward: {
          growth: 3000,
          summon: 30
        }
      }, {
        id: 'gear',
        label: '장비 단련의 주',
        emoji: '⚒️',
        track: 'dungeon',
        goal: 10,
        hint: '던전을 돌아 장비를 모으세요! 던전 10회 상자.',
        reward: {
          currency: 8000,
          summon: 20
        }
      }, {
        id: 'summon',
        label: '소환 축제의 주',
        emoji: '🔮',
        track: 'summon',
        goal: 20,
        hint: '소환 축제! 소환 20회 달성 상자.',
        reward: {
          gem: 300,
          summon: 50
        }
      }, {
        id: 'arena',
        label: '투기의 주',
        emoji: '🏆',
        track: 'arena',
        goal: 10,
        hint: '아레나에 도전하세요! 승리 10회 상자.',
        reward: {
          gem: 400,
          currency: 6000
        }
      }]);
      function currentTheme(now) {
        if (now === void 0) {
          now = Date.now();
        }
        return WEEKLY_THEMES[weekIndex(now) % WEEKLY_THEMES.length];
      }
      function ensure(state, now) {
        state.events = state.events || {
          week: -1,
          progress: 0,
          claimed: false
        };
        var w = weekIndex(now);
        if (state.events.week !== w) {
          state.events.week = w;
          state.events.progress = 0;
          state.events.claimed = false;
        }
        return state.events;
      }

      // 행동 적립 — 현재 테마의 track과 일치할 때만 진행도 증가.
      function recordEvent(state, key, n, now) {
        if (n === void 0) {
          n = 1;
        }
        if (now === void 0) {
          now = Date.now();
        }
        var e = ensure(state, now);
        if (currentTheme(now).track === key) e.progress += n;
      }

      // UI 현황: 테마·진행도·목표·완료·청구·남은 시간.
      function weeklyEvent(state, now) {
        if (now === void 0) {
          now = Date.now();
        }
        var e = ensure(state, now);
        var theme = currentTheme(now);
        var endsAt = (weekIndex(now) + 1) * WEEK_MS;
        return {
          id: theme.id,
          label: theme.label,
          emoji: theme.emoji,
          hint: theme.hint,
          track: theme.track,
          goal: theme.goal,
          reward: theme.reward,
          progress: Math.min(e.progress, theme.goal),
          done: e.progress >= theme.goal,
          claimed: e.claimed,
          endsInMs: Math.max(0, endsAt - now)
        };
      }

      // 보상 청구(주 1회) — 지갑 재화 지급.
      function claimWeekly(state, now) {
        if (now === void 0) {
          now = Date.now();
        }
        var e = ensure(state, now);
        var theme = currentTheme(now);
        if (e.claimed) return {
          ok: false,
          reason: '이번 주 이미 수령'
        };
        if (e.progress < theme.goal) return {
          ok: false,
          reason: '목표 미달'
        };
        earn(state.wallet, theme.reward);
        e.claimed = true;
        return {
          ok: true,
          reward: theme.reward
        };
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/fantasy.ts", ['cc'], function (exports) {
  var cclegacy;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }],
    execute: function () {
      cclegacy._RF.push({}, "17fb9+FiNtFcYmqffnuQCr8", "fantasy", undefined);
      // ─────────────────────────────────────────────────────────────
      // 컨셉 스킨: 판타지
      // 시스템의 추상 ID를 "표시 이름/테마"로만 매핑한다.
      // 숫자/규칙은 하나도 건드리지 않는다.
      // ─────────────────────────────────────────────────────────────

      var fantasyConcept = exports('fantasyConcept', {
        id: 'fantasy',
        title: '엘 로그',
        palette: {
          primary: '#6b4fbb',
          accent: '#f5c542'
        },
        // 원형 ID → 컨셉상의 이름/이모지
        archetypes: {
          VANGUARD: {
            name: '수호기사',
            emoji: '🛡️'
          },
          STRIKER: {
            name: '검투사',
            emoji: '⚔️'
          },
          SUPPORT: {
            name: '성녀',
            emoji: '✨'
          },
          ROGUE: {
            name: '도적',
            emoji: '🗡️'
          },
          ARCHER: {
            name: '궁수',
            emoji: '🏹'
          },
          MAGE: {
            name: '법사',
            emoji: '🔮'
          }
        },
        // 자원 키 → 표시명
        resources: {
          currency: {
            name: '골드',
            emoji: '🪙'
          },
          growth: {
            name: '정수',
            emoji: '💠'
          },
          summon: {
            name: '소환석',
            emoji: '🔮'
          },
          gem: {
            name: '다이아',
            emoji: '💎'
          }
        },
        terms: {
          unit: '영웅',
          party: '원정대',
          stage: '층',
          energy: '기력'
        },
        // 속성 ID(Core) → 표시명/이모지
        elements: {
          FIRE: {
            name: '불',
            emoji: '🔥'
          },
          WATER: {
            name: '물',
            emoji: '💧'
          },
          WOOD: {
            name: '숲',
            emoji: '🌿'
          },
          LIGHT: {
            name: '빛',
            emoji: '✨'
          },
          DARK: {
            name: '어둠',
            emoji: '🌑'
          }
        },
        // 캐릭터 도감 — 정체성. Core는 여기 mechanical 필드(archetype/signature/rarity/element)만
        // 읽고 이름/성격 등 flavor는 표시에만 쓴다. 소환은 이 pool에서 개별 캐릭터를 뽑는다.
        roster: [{
          id: 'knight',
          name: '기사',
          emoji: '🛡️',
          archetype: 'VANGUARD'
        }, {
          id: 'paladin',
          name: '근위 기사',
          emoji: '🛡️',
          archetype: 'VANGUARD'
        }, {
          id: 'paladin_with_helmet',
          name: '적갑 기사',
          emoji: '🛡️',
          archetype: 'VANGUARD'
        }, {
          id: 'skeleton_golem',
          name: '사무라이 대장',
          emoji: '🏯',
          archetype: 'VANGUARD'
        }, {
          id: 'barbarian',
          name: '전사',
          emoji: '⚔️',
          archetype: 'STRIKER'
        }, {
          id: 'barbarian_large',
          name: '중갑 전사',
          emoji: '🛡️',
          archetype: 'STRIKER'
        }, {
          id: 'werewolf_man',
          name: '창병',
          emoji: '🔱',
          archetype: 'STRIKER'
        }, {
          id: 'werewolf_wolf',
          name: '무투가',
          emoji: '👊',
          archetype: 'STRIKER'
        }, {
          id: 'skeleton_warrior',
          name: '사무라이',
          emoji: '🗡️',
          archetype: 'STRIKER'
        }, {
          id: 'skeleton_minion',
          name: '낭인',
          emoji: '🗡️',
          archetype: 'STRIKER'
        }, {
          id: 'druid',
          name: '핏빛 백작부인',
          emoji: '🩸',
          archetype: 'SUPPORT'
        }, {
          id: 'animatronic_normal',
          name: '늑대 소녀',
          emoji: '🐺',
          archetype: 'SUPPORT'
        }, {
          id: 'rogue',
          name: '시노비',
          emoji: '🥷',
          archetype: 'ROGUE'
        }, {
          id: 'rogue_hooded',
          name: '쿠노이치',
          emoji: '🥷',
          archetype: 'ROGUE'
        }, {
          id: 'skeleton_rogue',
          name: '탁발승',
          emoji: '📿',
          archetype: 'ROGUE'
        }, {
          id: 'animatronic_creepy',
          name: '도롱이 자객',
          emoji: '🌾',
          archetype: 'ROGUE'
        }, {
          id: 'ranger',
          name: '사무라이 궁수',
          emoji: '🏹',
          archetype: 'ARCHER'
        }, {
          id: 'engineer',
          name: '흡혈 검사',
          emoji: '🦇',
          archetype: 'ARCHER'
        }, {
          id: 'mage',
          name: '화염술사',
          emoji: '🔥',
          archetype: 'MAGE'
        }, {
          id: 'necromancer',
          name: '번개술사',
          emoji: '⚡',
          archetype: 'MAGE'
        }, {
          id: 'skeleton_mage',
          name: '방랑 술사',
          emoji: '🔮',
          archetype: 'MAGE'
        },
        // ── 신규 영웅(카탈로그 선택분) ──
        {
          id: 'anime_warrior',
          name: '무사',
          emoji: '⚔️',
          archetype: 'STRIKER'
        }, {
          id: 'beast_anime',
          name: '야수 전사',
          emoji: '🐾',
          archetype: 'STRIKER'
        }, {
          id: 'child',
          name: '견습생',
          emoji: '🧒',
          archetype: 'SUPPORT'
        }, {
          id: 'dark_elf',
          name: '다크엘프',
          emoji: '🏹',
          archetype: 'ROGUE'
        }, {
          id: 'elf_royal',
          name: '엘프 왕족',
          emoji: '👑',
          archetype: 'SUPPORT'
        }, {
          id: 'elf_warrior',
          name: '엘프 전사',
          emoji: '🏹',
          archetype: 'ARCHER'
        }, {
          id: 'ninja',
          name: '닌자',
          emoji: '🥷',
          archetype: 'ROGUE'
        }, {
          id: 'samurai',
          name: '사무라이',
          emoji: '🗡️',
          archetype: 'STRIKER'
        }, {
          id: 'satyr',
          name: '사티로스',
          emoji: '🐐',
          archetype: 'STRIKER'
        }, {
          id: 'shinobi',
          name: '시노비',
          emoji: '🥷',
          archetype: 'ROGUE'
        }, {
          id: 'wizard2',
          name: '원소술사',
          emoji: '🧙',
          archetype: 'MAGE'
        }, {
          id: 'yokai_hero',
          name: '요괴 검객',
          emoji: '👹',
          archetype: 'STRIKER'
        }, {
          id: 'girl_warrior',
          name: '여전사',
          emoji: '🗡️',
          archetype: 'STRIKER'
        }, {
          id: 'gladiator',
          name: '검투사',
          emoji: '🛡️',
          archetype: 'VANGUARD'
        }, {
          id: 'royal',
          name: '왕족',
          emoji: '👑',
          archetype: 'SUPPORT'
        }, {
          id: 'npc_elf',
          name: '엘프 궁수',
          emoji: '🏹',
          archetype: 'ARCHER'
        }, {
          id: 'orc_hero',
          name: '오크 투사',
          emoji: '🪓',
          archetype: 'STRIKER'
        }, {
          id: 'dark_elf_queen',
          name: '다크엘프 여왕',
          emoji: '🌑',
          archetype: 'MAGE'
        }, {
          id: 'priest2',
          name: '사제',
          emoji: '✨',
          archetype: 'SUPPORT'
        }, {
          id: 'pyromancer',
          name: '화염술사',
          emoji: '🔥',
          archetype: 'MAGE'
        }, {
          id: 'schoolboy',
          name: '학생',
          emoji: '🎒',
          archetype: 'SUPPORT'
        }, {
          id: 'swat',
          name: '특수요원',
          emoji: '🔫',
          archetype: 'STRIKER'
        }, {
          id: 'scientist',
          name: '과학자',
          emoji: '🔬',
          archetype: 'SUPPORT'
        }, {
          id: 'witch',
          name: '마녀',
          emoji: '🧹',
          archetype: 'MAGE'
        }],
        // 코스튬 — 캐릭터별 외형+소량 보너스. 친밀도 Lv로 해금.
        // (캐릭터 id로 키잉. 보너스는 장착 시 Core 모디파이어로 흘러간다.)
        costumes: {},
        // 스토리 캠페인 — 월드 서사(챕터별 보스 앞의 이야기). Core가 진행/전투를 담당.
        campaign: [{
          title: '균열의 조짐',
          story: '엘 로그의 하늘에 균열이 번진다. 첫 마수가 성문을 두드리고, 견습들이 검을 든다.'
        }, {
          title: '잿빛 숲',
          story: '숲이 시들어간다. 나무마다 어둠이 스며 마수를 낳는다. 그 근원을 찾아 깊이 들어선다.'
        }, {
          title: '서리 관문',
          story: '얼어붙은 관문의 수호자가 길을 막는다. 오래된 맹세를 지키는 냉혹한 거인이다.'
        }, {
          title: '폭풍의 첨탑',
          story: '번개가 첨탑을 휘감는다. 폭풍을 다스리는 옛 마법사가 침입자를 시험한다.'
        }, {
          title: '빛과 그림자',
          story: '신전의 빛이 흔들린다. 배신한 사제가 그림자와 계약해 성역을 더럽혔다.'
        }, {
          title: '심연의 문',
          story: '대지 아래 잠든 문이 열린다. 균열의 진원, 심연에서 무언가가 올라온다.'
        }, {
          title: '왕좌의 그림자',
          story: '무너진 왕성의 옥좌에 그림자 군주가 앉아 있다. 세계를 삼키려는 자와의 대치.'
        }, {
          title: '연대기의 끝',
          story: '균열의 핵심에서 종말이 형상을 갖춘다. 모든 유대와 성장을 걸고 마지막 일격을.'
        },
        // ── 2부: 심연의 잔재 ──
        {
          title: '잔재의 부활',
          story: '끝낸 줄 알았던 균열의 잔재가 되살아난다. 세계의 상처는 아직 아물지 않았다.'
        }, {
          title: '타락한 영웅',
          story: '어둠에 물든 옛 동료가 앞을 막는다. 검을 겨누는 손이 무겁다.'
        }, {
          title: '공허의 여왕',
          story: '균열 너머 공허에서 온 지배자가 강림한다. 존재 자체가 세계를 갉아먹는다.'
        }, {
          title: '새벽의 맹세',
          story: '심연의 근원과 마주선다. 모든 것을 건 마지막 맹세 — 엘 로그에 새벽이 온다.'
        }]
      });
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/features.ts", ['cc'], function (exports) {
  var cclegacy;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }],
    execute: function () {
      exports({
        isOn: isOn,
        simplePreset: simplePreset
      });
      cclegacy._RF.push({}, "884d3LAqV9PsqiuhCbJsMII", "features", undefined);
      // 기능 플래그 — 선택 모듈 on/off (단순 코어 + 옵션 모듈 구조)
      // 최소 코어(캐릭터·전투·파티·캠페인·성장)는 항상 켜짐(여기 없음).
      // 각 선택 모듈은 진입점에서 isOn('key') 로 확인해 off면 스킵한다.
      //
      // ▶ 모듈 추가법: (1) MODULE_META 에 {key:{label,group,desc}} 추가
      //                (2) FEATURES 에 key: true 한 줄 추가
      //                (3) 해당 모듈 코드 진입점에 isOn('key') 가드
      //                컨트롤 판넬(control-panel.bat)이 자동으로 인식한다.

      // 모듈 메타 — 컨트롤 판넬 표시용(그룹별 구분). 순수 정보, 로직 없음.
      var MODULE_META = exports('MODULE_META', {
        elements: {
          label: '속성 상성',
          group: '전투',
          desc: '속성 유불리·속성 시너지'
        },
        rarity: {
          label: '등급(N~UR)',
          group: '전투',
          desc: '캐릭터/장비/펫 품질 등급·전투력 배수'
        },
        gacha: {
          label: '가챠 소환',
          group: '수집·소환',
          desc: '캐릭터/장비 뽑기(천장 포함)'
        },
        summon: {
          label: '소환 숙련',
          group: '수집·소환',
          desc: '소환 누적 보상'
        },
        sigweapon: {
          label: '시그니처 무기',
          group: '수집·소환',
          desc: '캐릭터 전용 무기'
        },
        gear: {
          label: '장비',
          group: '장비·강화',
          desc: '장비 착용·강화·분해'
        },
        runes: {
          label: '룬',
          group: '장비·강화',
          desc: '룬 세팅'
        },
        relics: {
          label: '유물',
          group: '장비·강화',
          desc: '유물 강화'
        },
        emblems: {
          label: '엠블럼(문장)',
          group: '장비·강화',
          desc: '계정 공유 버프'
        },
        pets: {
          label: '펫',
          group: '동료',
          desc: '펫 보유·장착'
        },
        guardians: {
          label: '가디언(정령)',
          group: '동료',
          desc: '가디언 보유·장착'
        },
        costumes: {
          label: '코스튬',
          group: '외형',
          desc: '캐릭터 외형·소량 보너스'
        },
        arena: {
          label: '아레나',
          group: '콘텐츠',
          desc: '경쟁 전투'
        },
        guild: {
          label: '길드',
          group: '콘텐츠',
          desc: '길드 시스템'
        },
        tower: {
          label: '무한의 탑',
          group: '콘텐츠',
          desc: '층 등반 콘텐츠'
        },
        expedition: {
          label: '원정(로그라이트)',
          group: '콘텐츠',
          desc: '좌→우 진격 런·강화 3택·소모전'
        },
        season: {
          label: '시즌',
          group: '콘텐츠',
          desc: '시즌 패스·보상'
        },
        events: {
          label: '이벤트',
          group: '콘텐츠',
          desc: '한정 이벤트'
        },
        intimacy: {
          label: '친밀도',
          group: '관계',
          desc: '캐릭터 호감도'
        },
        shop: {
          label: '상점',
          group: '상점',
          desc: '상점·교환'
        }
      });

      // 플래그 값 — 컨트롤 판넬이 이 블록의 true/false 만 토글한다(한 줄=한 모듈).
      var FEATURES = exports('FEATURES', {
        elements: false,
        rarity: false,
        gacha: true,
        summon: true,
        sigweapon: true,
        gear: true,
        runes: true,
        relics: true,
        emblems: true,
        pets: true,
        guardians: true,
        costumes: true,
        arena: true,
        guild: true,
        tower: true,
        expedition: true,
        season: true,
        events: true,
        intimacy: true,
        shop: true
      });

      // 선택 모듈이 켜져 있는지. 코어(플래그 없는 키)는 항상 true.
      function isOn(key) {
        return FEATURES[key] !== false;
      }

      // 단순 코어 프리셋 — 최소 코어 외 선택 모듈을 전부 끈 값 묶음.
      function simplePreset() {
        var f = {};
        for (var _i = 0, _Object$keys = Object.keys(FEATURES); _i < _Object$keys.length; _i++) {
          var k = _Object$keys[_i];
          f[k] = false;
        }
        return f;
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/formation.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './units.ts'], function (exports) {
  var _createForOfIteratorHelperLoose, cclegacy, toCombatProfile;
  return {
    setters: [function (module) {
      _createForOfIteratorHelperLoose = module.createForOfIteratorHelperLoose;
    }, function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      toCombatProfile = module.toCombatProfile;
    }],
    execute: function () {
      exports({
        autoFormation: autoFormation,
        formationActive: formationActive,
        formationModsFor: formationModsFor,
        formationSummary: formationSummary,
        hasFrontLine: hasFrontLine,
        pruneFormation: pruneFormation,
        setFormation: setFormation,
        toggleFormation: toggleFormation,
        unitRole: unitRole
      });
      cclegacy._RF.push({}, "ac8ba0NsqNDXofHxdLgEQa4", "formation", undefined);

      // ─────────────────────────────────────────────────────────────
      // 진형 — 파티 "배치"에 전략을 부여한다.
      // 각 편성 유닛을 전열(front)·중열(mid)·후열(back) 중 하나에 둔다.
      //   · 전열 : 방어벽. 방어·체력↑ 대신 공격↓ (탱킹 자세). 정원 2.
      //   · 중열 : 균형. 모든 스탯 소폭↑ (범용 자세). 정원 2.
      //   · 후열 : 보호받는 딜러. 공격↑ 대신 방어·체력↓ (유리대포). 정원 1.
      //   · 중열·후열은 전열이 최소 1명 있어야 보호받음 — 전열이 없으면 공격 보너스 소멸.
      // 시너지와 마찬가지로 resolve()가 프로필 단계에서 적용한다.
      //
      // 하위호환: 아무도 중열/후열로 지정하지 않으면(=기본 전원 전열) 진형은
      // "휴면" 상태로 어떤 보정도 걸지 않는다. 하나라도 배치하는 순간 발동.
      // ─────────────────────────────────────────────────────────────

      var FORMATION_ROLES = exports('FORMATION_ROLES', ['front', 'mid', 'back']);
      var ROLE_LABEL = exports('ROLE_LABEL', {
        front: '전열',
        mid: '중열',
        back: '후열'
      });
      // 정원 — 전열2 · 중열2 · 후열1 = 총 5명 편성 구조.
      var ROLE_CAP = exports('ROLE_CAP', {
        front: 2,
        mid: 2,
        back: 1
      });
      var CAP_TOTAL = ROLE_CAP.front + ROLE_CAP.mid + ROLE_CAP.back;

      // 진형 보정 계수 (전열/중열/후열 각각의 스탯 배수).
      var FORMATION_MODS = exports('FORMATION_MODS', {
        front: {
          def: 1.25,
          hp: 1.15,
          dps: 0.85
        },
        mid: {
          def: 1.05,
          hp: 1.05,
          dps: 1.05
        },
        midExposed: {
          def: 1.05,
          hp: 1.05,
          dps: 1.0
        },
        // 전열 없이 노출된 중열
        back: {
          dps: 1.30,
          def: 0.80,
          hp: 0.90
        },
        backExposed: {
          dps: 1.0,
          def: 0.80,
          hp: 0.90
        } // 전열 없이 노출된 후열
      });

      // formation 맵에서 uid의 역할을 읽는다 — 미지정은 전열.
      function roleOf(formation, uid) {
        var r = formation && formation[uid];
        return FORMATION_ROLES.includes(r) ? r : 'front';
      }

      // uid의 진형 역할 — 미지정은 전열.
      function unitRole(state, uid) {
        return roleOf(state.formation, uid);
      }

      // 파티 내 역할별 인원수(정원 검사용).
      function roleCounts(state) {
        var counts = {
          front: 0,
          mid: 0,
          back: 0
        };
        for (var _iterator = _createForOfIteratorHelperLoose(state.party || []), _step; !(_step = _iterator()).done;) {
          var uid = _step.value;
          counts[unitRole(state, uid)]++;
        }
        return counts;
      }

      // 진형 배치: 편성된 유닛만 지정 가능. 대상 역할의 정원을 넘으면 거부.
      function setFormation(state, uid, role) {
        if (!FORMATION_ROLES.includes(role)) return {
          ok: false,
          reason: '잘못된 진형'
        };
        if (!state.party.includes(uid)) return {
          ok: false,
          reason: '편성되지 않은 유닛'
        };
        var cur = unitRole(state, uid);
        if (cur !== role) {
          var counts = roleCounts(state);
          if (counts[role] >= ROLE_CAP[role]) {
            return {
              ok: false,
              reason: ROLE_LABEL[role] + " \uC815\uC6D0(" + ROLE_CAP[role] + ") \uCD08\uACFC"
            };
          }
        }
        state.formation = state.formation || {};
        if (role === 'front') delete state.formation[uid];else state.formation[uid] = role;
        return {
          ok: true,
          role: role
        };
      }

      // 전열→중열→후열→전열 순환. 정원이 찬 역할은 건너뛴다.
      function toggleFormation(state, uid) {
        var cur = unitRole(state, uid);
        var idx = FORMATION_ROLES.indexOf(cur);
        for (var step = 1; step <= FORMATION_ROLES.length; step++) {
          var next = FORMATION_ROLES[(idx + step) % FORMATION_ROLES.length];
          var r = setFormation(state, uid, next);
          if (r.ok) return r;
        }
        return {
          ok: false,
          reason: '배치할 자리가 없습니다'
        };
      }

      // 편성이 바뀌어 파티에 없는 uid가 남았으면 정리.
      function pruneFormation(state) {
        if (!state.formation) return;
        for (var _i = 0, _Object$keys = Object.keys(state.formation); _i < _Object$keys.length; _i++) {
          var uid = _Object$keys[_i];
          if (!state.party.includes(uid)) delete state.formation[uid];
        }
      }

      // 진형 활성 여부 — 중열/후열이 1명 이상일 때만 발동.
      function formationActive(formation, party) {
        if (!formation) return false;
        return party.some(function (u) {
          return roleOf(formation, u.uid) !== 'front';
        });
      }

      // 전투 판정용 — 역할별 스탯 보정 계수를 반환(전열 유무에 따라 노출 여부 반영).
      function formationModsFor(formation, uid, hasFront) {
        var role = roleOf(formation, uid);
        if (role === 'front') return FORMATION_MODS.front;
        if (role === 'mid') return hasFront ? FORMATION_MODS.mid : FORMATION_MODS.midExposed;
        return hasFront ? FORMATION_MODS.back : FORMATION_MODS.backExposed;
      }

      // party 중 전열이 1명이라도 있는지(보호 여부 판정 공용).
      function hasFrontLine(formation, party) {
        return party.some(function (u) {
          return roleOf(formation, u.uid) === 'front';
        });
      }

      // 진형 요약(UI 브리핑용): 전열/중열/후열 인원과 노출 경고.
      function formationSummary(state) {
        var front = [],
          mid = [],
          back = [];
        for (var _iterator2 = _createForOfIteratorHelperLoose(state.party || []), _step2; !(_step2 = _iterator2()).done;) {
          var uid = _step2.value;
          var role = unitRole(state, uid);
          (role === 'back' ? back : role === 'mid' ? mid : front).push(uid);
        }
        var active = mid.length > 0 || back.length > 0;
        var exposed = active && front.length === 0;
        return {
          front: front,
          mid: mid,
          back: back,
          cap: ROLE_CAP,
          active: active,
          exposed: exposed
        };
      }

      // 역할별 원형 우선순위 — "누가 그 자리에 어울리나"의 1차 기준(여러 원형 가능).
      //   전열: 방어형(VANGUARD, 근접 탱커) 우선
      //   중열: 근접 딜러(STRIKER 전사·ROGUE 도적) 우선 — 어느 정도 맞으며 딜을 넣는 자리
      //   후열: 원거리·지원(MAGE 법사·ARCHER 궁수·SUPPORT 지원) 우선 — 남는 인원은
      //         앞열(전열·중열)에 못 들어간 유닛이 화력 순으로 흘러들어온다.
      var ROLE_ARCHETYPE_PRIORITY = {
        front: ['VANGUARD'],
        mid: ['STRIKER', 'ROGUE'],
        back: ['MAGE', 'ARCHER', 'SUPPORT']
      };

      // ── 자동 배치 ────────────────────────────────────────────────
      // 전열·중열·후열 모두 같은 규칙을 적용한다:
      //   1) 그 역할의 우선 원형을 스탯 순으로 목표치까지 채운다.
      //   2) 우선 원형이 모자라면, 아직 미배치인 유닛을 스탯 순으로 채워 넣는다
      //      (역할 무관 — "앞열에 못 들어간 유닛이 뒤로 밀린다"는 자연스러운 흐름).
      // 정원(2·3·2)은 인원이 모자라면 비율대로 줄인다(예: 2명이면 전열1·후열1).
      function autoFormation(state) {
        var byId = new Map((state.units || []).map(function (u) {
          return [u.uid, u];
        }));
        var party = (state.party || []).map(function (uid) {
          return byId.get(uid);
        }).filter(Boolean);
        var total = party.length;
        if (!total) return {
          ok: false,
          reason: '편성된 유닛 없음'
        };

        // toCombatProfile을 재사용해 실제 전투 엔진의 dps/hp/def를 그대로 채점 지표로 쓴다
        // (자체 공식을 따로 두면 전투 공식이 바뀔 때 조용히 어긋날 수 있음).
        var scored = party.map(function (u) {
          var p = toCombatProfile(u);
          return {
            uid: u.uid,
            archetype: u.archetype,
            tank: p.def * 2 + p.hp * 0.05,
            // 방어 위주 지표 — 전열 적합도(원형이 같을 때 정렬용)
            strike: p.dps // 화력 지표(치명타 반영 실제 dps) — 중·후열 적합도(정렬용)
          };
        });

        // 인원이 정원(CAP_TOTAL)보다 적으면 전열·후열 목표치를 비율로 낮춘다. 중열은 나머지.
        var frontN = Math.min(ROLE_CAP.front, Math.ceil(total * ROLE_CAP.front / CAP_TOTAL));
        var backN = Math.min(ROLE_CAP.back, Math.ceil(total * ROLE_CAP.back / CAP_TOTAL), total - frontN);
        var midN = total - frontN - backN;
        var targets = {
          front: frontN,
          mid: midN,
          back: backN
        };
        var sortKey = {
          front: 'tank',
          mid: 'strike',
          back: 'strike'
        };

        // 역할 하나를 채운다: 1순위 원형 → 부족분은 남은 유닛 중 정렬 기준 순.
        var placed = new Set();
        function fill(role) {
          var n = targets[role];
          var key = sortKey[role];
          var priArchs = ROLE_ARCHETYPE_PRIORITY[role];
          var pool = scored.filter(function (x) {
            return !placed.has(x.uid);
          });
          var primary = pool.filter(function (x) {
            return priArchs.includes(x.archetype);
          }).sort(function (a, b) {
            return b[key] - a[key];
          });
          var picked = primary.slice(0, n);
          if (picked.length < n) {
            var rest = pool.filter(function (x) {
              return !priArchs.includes(x.archetype);
            }).sort(function (a, b) {
              return b[key] - a[key];
            });
            picked = picked.concat(rest.slice(0, n - picked.length));
          }
          for (var _iterator3 = _createForOfIteratorHelperLoose(picked), _step3; !(_step3 = _iterator3()).done;) {
            var x = _step3.value;
            placed.add(x.uid);
          }
          return picked.map(function (x) {
            return x.uid;
          });
        }

        // 전열 → 중열 → 후열 순으로 채운다: 후열의 "앞열 미배치 인원 우선"이
        // 자연히 성립하려면 전열·중열을 먼저 확정해야 한다.
        var frontIds = fill('front');
        var midIds = fill('mid');
        var backIds = fill('back');

        // 적용 순서: 정원 초과가 절대 없도록(비-전열부터 명시 지정, 전열은 기본값이라 항상 통과).
        state.formation = {}; // 초기화 후 재배치
        for (var _iterator4 = _createForOfIteratorHelperLoose(backIds), _step4; !(_step4 = _iterator4()).done;) {
          var uid = _step4.value;
          setFormation(state, uid, 'back');
        }
        for (var _iterator5 = _createForOfIteratorHelperLoose(midIds), _step5; !(_step5 = _iterator5()).done;) {
          var _uid = _step5.value;
          setFormation(state, _uid, 'mid');
        }
        return {
          ok: true,
          front: frontIds,
          mid: midIds,
          back: backIds
        };
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/gacha.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './units.ts', './economy.ts', './rng.ts'], function (exports) {
  var _extends, cclegacy, createUnit, spend, weightedPick;
  return {
    setters: [function (module) {
      _extends = module.extends;
    }, function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      createUnit = module.createUnit;
    }, function (module) {
      spend = module.spend;
    }, function (module) {
      weightedPick = module.weightedPick;
    }],
    execute: function () {
      exports({
        summonMulti: summonMulti,
        summonOne: summonOne
      });
      cclegacy._RF.push({}, "a6221toB15L9r7m9ilf4mKS", "gacha", undefined);

      // ─────────────────────────────────────────────────────────────
      // 소환(가차) 시스템 — summon 자원으로 신규 유닛 획득.
      //   · 등급(rarity)은 확률로, 역할(archetype)은 균등으로 결정
      //   · 등급이 시작 랭크를 정한다 (전설=R3에서 시작)
      //   · 천장(pity): PITY_HARD 회 안에 최고 등급 보장
      //   · RNG 주입 → 시드로 재현 가능
      // ─────────────────────────────────────────────────────────────

      var RARITY = exports('RARITY', {
        N: {
          id: 'N',
          label: '노멀',
          weight: 100,
          startRank: 1
        },
        R: {
          id: 'R',
          label: '레어',
          weight: 66,
          startRank: 1
        },
        SR: {
          id: 'SR',
          label: '에픽',
          weight: 28,
          startRank: 2
        },
        SSR: {
          id: 'SSR',
          label: '전설',
          weight: 5,
          startRank: 3
        },
        UR: {
          id: 'UR',
          label: '신화',
          weight: 1,
          startRank: 4
        } // 최고 티어 (~0.5%)
      });

      var ARCH_IDS = ['VANGUARD', 'STRIKER', 'SUPPORT'];
      var PULL_COST = exports('PULL_COST', {
        summon: 10
      });
      var PITY_HARD = 90; // 이 횟수 안에 SSR 보장
      var MULTI_FLOOR = 'SR'; // 10연차 최소 1개 보장 등급

      function rollRarity(rng) {
        return weightedPick(Object.values(RARITY).map(function (r) {
          return {
            weight: r.weight,
            r: r
          };
        }), rng).r;
      }
      function rollArchetype(rng) {
        return ARCH_IDS[Math.floor(rng() * ARCH_IDS.length)];
      }

      // pool에서 해당 등급의 캐릭터를 고른다. 없으면 pool 전체에서.
      function pickCharacter(pool, rarityId, rng) {
        var of = pool.filter(function (c) {
          return c.rarity === rarityId;
        });
        var from = of.length ? of : pool;
        return from[Math.floor(rng() * from.length)];
      }

      // 한 유닛을 실제로 만들어 상태에 추가.
      // pool(컨셉 도감)이 주어지면 "개별 캐릭터"를 뽑고, 없으면 원형만 뽑는다.
      function grant(state, rarity, rng, pool) {
        if (pool && pool.length) {
          var ch = pickCharacter(pool, rarity.id, rng);
          var _unit = createUnit(ch.archetype, {
            level: 1,
            rank: rarity.startRank,
            characterId: ch.id,
            signature: ch.signature,
            element: ch.element
          });
          _unit.rarity = rarity.id;
          state.units.push(_unit);
          return {
            rarity: rarity.id,
            archetype: ch.archetype,
            characterId: ch.id,
            uid: _unit.uid,
            unit: _unit
          };
        }
        var archetype = rollArchetype(rng);
        var unit = createUnit(archetype, {
          level: 1,
          rank: rarity.startRank
        });
        unit.rarity = rarity.id;
        state.units.push(unit);
        return {
          rarity: rarity.id,
          archetype: archetype,
          uid: unit.uid,
          unit: unit
        };
      }

      // 단차 소환. pool 주면 캐릭터 소환, 없으면 원형 소환.
      function summonOne(state, rng, pool) {
        if (rng === void 0) {
          rng = Math.random;
        }
        if (pool === void 0) {
          pool = null;
        }
        if (!spend(state.wallet, PULL_COST)) {
          return {
            ok: false,
            reason: '소환 재화 부족',
            cost: PULL_COST
          };
        }
        state.gacha.pity += 1;
        var rarity;
        if (state.gacha.pity >= PITY_HARD) {
          rarity = RARITY.SSR; // 천장 보장
          state.gacha.pity = 0;
        } else {
          rarity = rollRarity(rng);
          if (rarity.id === 'SSR' || rarity.id === 'UR') state.gacha.pity = 0; // 최고등급 뽑으면 천장 리셋
        }

        return _extends({
          ok: true
        }, grant(state, rarity, rng, pool));
      }

      // 10연차 소환 (최소 1개 SR 이상 보장). pool 주면 캐릭터 소환.
      function summonMulti(state, count, rng, pool) {
        if (count === void 0) {
          count = 10;
        }
        if (rng === void 0) {
          rng = Math.random;
        }
        if (pool === void 0) {
          pool = null;
        }
        var cost = {
          summon: PULL_COST.summon * count
        };
        if (!spend(state.wallet, cost)) {
          return {
            ok: false,
            reason: '소환 재화 부족',
            cost: cost
          };
        }
        var results = [];
        var rank = {
          N: 0,
          R: 1,
          SR: 2,
          SSR: 3,
          UR: 4
        };
        for (var i = 0; i < count; i++) {
          state.gacha.pity += 1;
          var rarity = void 0;
          if (state.gacha.pity >= PITY_HARD) {
            rarity = RARITY.SSR;
            state.gacha.pity = 0;
          } else {
            rarity = rollRarity(rng);
            if (rarity.id === 'SSR' || rarity.id === 'UR') state.gacha.pity = 0;
          }
          results.push(grant(state, rarity, rng, pool));
        }
        // 바닥 보장: SR 이상이 하나도 없으면 마지막을 승급
        if (!results.some(function (r) {
          return rank[r.rarity] >= rank[MULTI_FLOOR];
        })) {
          var last = results[results.length - 1];
          var u = state.units.find(function (x) {
            return x.uid === last.uid;
          });
          u.rank = RARITY[MULTI_FLOOR].startRank;
          u.rarity = MULTI_FLOOR;
          last.rarity = MULTI_FLOOR;
        }
        return {
          ok: true,
          results: results
        };
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/gameState.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './economy.ts', './stats.ts', './synergy.ts'], function (exports) {
  var _createForOfIteratorHelperLoose, cclegacy, createWallet, computePower, teamSynergy;
  return {
    setters: [function (module) {
      _createForOfIteratorHelperLoose = module.createForOfIteratorHelperLoose;
    }, function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      createWallet = module.createWallet;
    }, function (module) {
      computePower = module.computePower;
    }, function (module) {
      teamSynergy = module.teamSynergy;
    }],
    execute: function () {
      exports({
        autoParty: autoParty,
        createGameState: createGameState,
        getPartyUnits: getPartyUnits,
        togglePartyMember: togglePartyMember
      });
      cclegacy._RF.push({}, "f27d6Yf81VAG4bEBdo9UvtT", "gameState", undefined);

      // ─────────────────────────────────────────────────────────────
      // 게임 상태(세이브) — IP의 지속 자산.
      // 장르도 컨셉도 여기 없다. 순수하게 "무엇을 가졌고 어디까지 왔나".
      // 같은 상태 객체를 RPG 어댑터에도, 방치형 어댑터에도 그대로 넣을 수 있다.
      // ─────────────────────────────────────────────────────────────

      // 파티 최대 편성 인원(장르 무관 기본 정책). 전투는 파티 전원 합산.
      // 진형 정원(전열2·중열2·후열1)과 일치 — formation.ROLE_CAP 참고.
      var MAX_PARTY = exports('MAX_PARTY', 5);
      function createGameState(_temp) {
        var _ref = _temp === void 0 ? {} : _temp,
          _ref$units = _ref.units,
          units = _ref$units === void 0 ? [] : _ref$units,
          _ref$party = _ref.party,
          party = _ref$party === void 0 ? [] : _ref$party;
        return {
          units: units,
          // 보유 유닛 인스턴스 배열
          party: party,
          // 편성된 유닛 uid 배열 (최대 정책은 장르가 정함)
          formation: {},
          // 진형: uid → 'mid'|'back' (미기재=전열). 후열/중열 1명↑일 때만 발동
          formationPresets: {},
          // 편성 프리셋(1~5): slot → { party, formation, savedAt }

          inventory: [],
          // 미장착 장비 인스턴스 배열
          runeBag: [],
          // 미장착 룬 인스턴스 배열
          wallet: createWallet(),
          stage: 1,
          // 현재 도전/진행 스테이지 (환생 시 리셋)
          difficulty: 'normal',
          // 방치 난이도 (일반/험난/지옥/나락)
          maxStage: 1,
          // 이번 회차 최고 도달 (환생 시 리셋)
          peakStage: 1,
          // 역대 최고 도달 (환생해도 유지 — 실제 진행도)
          energy: 60,
          // RPG 장르가 사용하는 행동력 (방치형은 무시)
          prestige: 0,
          // 방치형 장르가 사용하는 환생 횟수 (RPG는 무시)
          lastTick: null,
          // 방치형 오프라인 계산 기준 시각(ms)
          gacha: {
            pity: 0
          },
          // 소환 천장 카운터
          // 일일 콘텐츠(출석·미션·던전) 상태
          daily: {
            epochDay: 0,
            streak: 0,
            claimedDay: -1,
            missions: {
              summon: 0,
              upgrade: 0,
              dungeon: 0
            },
            claimed: {},
            dungeon: {
              GOLD: 0,
              ESSENCE: 0
            },
            ads: {}
          },
          relics: {},
          // 유물 id → 레벨
          emblems: {},
          // 엠블럼(문장) id → 레벨 (계정 공유 버프)
          guardians: {
            owned: {},
            active: []
          },
          // 정령/가디언 보유(id→레벨) + 장착(최대 3)
          pets: {
            owned: {},
            active: []
          },
          // 펫 보유(id→레벨) + 장착(최대 3)
          shop: {
            purchased: {}
          },
          // 1회성 패키지 구매 기록
          rentals: {},
          // 기간제 대여 { slotId: { tier, expiresAt } }
          admin: {
            overrides: {}
          },
          // 운영자 밸런스 오버라이드 { path: value }
          materials: {
            elemEssence: 0,
            petShard: {
              R: 0,
              SR: 0,
              SSR: 0,
              UR: 0
            }
          },
          // 던전 재료
          arena: {
            points: 0,
            day: -1,
            entries: 0
          },
          // 아레나(경쟁) 랭크·일일 입장
          ladders: {},
          // 3중 리그(주간/격주/월간) 포인트·주기
          mail: [],
          // 우편함(순위 정산·이벤트 보상)
          guild: {
            coins: 0,
            day: -1,
            attacks: 0,
            tier: 1,
            bossHp: null
          },
          // 길드 보스 레이드
          meta: {
            achv: {},
            coll: {},
            season: {
              claimed: {},
              premium: false
            }
          },
          // 도감·업적·시즌패스 청구 기록
          campaign: {
            cleared: 0
          },
          // 스토리 캠페인 클리어 챕터 수
          run: null,
          // 원정(로그라이트) 진행 중 스냅샷 — 없으면 null. run.mjs 참조
          expedition: {
            maxFloor: 1,
            tokens: 0,
            upgrades: {
              might: 0,
              vigor: 0,
              fortune: 0
            }
          },
          // 원정 메타(층 해금·토큰·영구 업그레이드)
          tutorial: {
            introSeen: false
          },
          // 온보딩: 첫 소개 확인 여부
          settings: {
            muted: false,
            haptics: true,
            reduceMotion: false,
            lang: 'ko'
          },
          // 사운드·햅틱·전투연출·언어
          tower: {
            floor: 1,
            best: 1
          },
          // 무한의 탑 현재/최고 층
          // 개성(코스메틱) — 능력치 무관. 닉네임·대표영웅·프레임·칭호 + 광고제거 패스
          profile: {
            name: '조련사',
            avatarUid: null,
            frame: 'none',
            title: 'none',
            premium: false,
            owned: {
              frame: {},
              title: {}
            }
          },
          // 소환 숙련도 — 배너별 누적 소환 횟수·청구 레벨 (최대 15)
          summonMastery: {
            hero: {
              count: 0,
              claimed: 0
            },
            pet: {
              count: 0,
              claimed: 0
            },
            gear: {
              count: 0,
              claimed: 0
            },
            rune: {
              count: 0,
              claimed: 0
            },
            cosmetic: {
              count: 0,
              claimed: 0
            }
          },
          costumes: {
            owned: {}
          },
          // 캐릭터 코스튬(스킨) 보유 — 능력치 무관 순수 외형
          vip: {
            spend: 0
          } // 누적 결제액(원) — 과금 등급(VIP) 코스튬 해금용
        };
      }

      // party uid → 유닛 인스턴스 배열
      function getPartyUnits(state) {
        var byId = new Map(state.units.map(function (u) {
          return [u.uid, u];
        }));
        return state.party.map(function (uid) {
          return byId.get(uid);
        }).filter(Boolean);
      }

      // 파티 편성 토글: 이미 있으면 제거, 없으면 추가(최대 MAX_PARTY, 최소 1명 유지).
      function togglePartyMember(state, uid) {
        var has = state.party.includes(uid);
        if (has) {
          if (state.party.length <= 1) return {
            ok: false,
            reason: '최소 1명은 편성해야 합니다'
          };
          state.party = state.party.filter(function (x) {
            return x !== uid;
          });
          if (state.formation) delete state.formation[uid]; // 편성 해제 시 진형도 정리
          return {
            ok: true,
            inParty: false
          };
        }
        if (state.party.length >= MAX_PARTY) return {
          ok: false,
          reason: "\uD30C\uD2F0\uB294 \uCD5C\uB300 " + MAX_PARTY + "\uBA85"
        };
        if (!state.units.some(function (u) {
          return u.uid === uid;
        })) return {
          ok: false,
          reason: '보유하지 않은 유닛'
        };
        state.party = [].concat(state.party, [uid]);
        return {
          ok: true,
          inParty: true
        };
      }
      var SYNERGY_ARCHETYPES = ['VANGUARD', 'STRIKER', 'SUPPORT'];

      // 남은 슬롯을 전투력 상위 순으로 채운다. avoid(x)가 true인 후보는 1순위에서
      // 건너뛰되(시너지 유지 목적), 그래도 정원을 못 채우면 2차로 avoid 없이 채운다.
      function fillToSize(chosen, pool, size, avoid) {
        if (avoid === void 0) {
          avoid = function avoid() {
            return false;
          };
        }
        var ids = new Set(chosen.map(function (x) {
          return x.uid;
        }));
        var result = [].concat(chosen);
        var rest = pool.filter(function (x) {
          return !ids.has(x.uid);
        }).sort(function (a, b) {
          return b.power - a.power;
        });
        for (var _iterator = _createForOfIteratorHelperLoose(rest), _step; !(_step = _iterator()).done;) {
          var _x = _step.value;
          if (result.length >= size) break;
          if (avoid(_x)) continue;
          result.push(_x);
          ids.add(_x.uid);
        }
        if (result.length < size) {
          for (var _iterator2 = _createForOfIteratorHelperLoose(rest), _step2; !(_step2 = _iterator2()).done;) {
            var x = _step2.value;
            if (result.length >= size) break;
            if (ids.has(x.uid)) continue;
            result.push(x);
            ids.add(x.uid);
          }
        }
        return result;
      }

      // 조합의 "시너지 반영 전투력" — 개별 전투력 합 × 팀 시너지 배수(평균).
      // resolve()의 실제 배수 구조(atk/hp/def 각각 곱)를 근사해 평가한다.
      function evalComposition(scored) {
        var sumPower = scored.reduce(function (s, x) {
          return s + x.power;
        }, 0);
        var syn = teamSynergy(scored.map(function (x) {
          return x.unit;
        }));
        var avgMult = (syn.mult.atk + syn.mult.hp + syn.mult.def) / 3;
        return {
          score: sumPower * avgMult,
          syn: syn
        };
      }

      // 보유 유닛 중에서 "시너지까지 반영한 전투력"이 가장 높은 조합으로 파티를 채운다.
      //   · 단순 전투력 상위 정렬만으로는 삼위일체(3원형)·원형 집중·속성 결속처럼
      //     파티 전체에 곱연산으로 붙는 시너지를 놓칠 수 있다(개별 최강이 전체
      //     최강은 아님). 몇 가지 유의미한 후보 조합을 만들어 실제로 비교한다.
      function autoParty(state, size) {
        if (size === void 0) {
          size = MAX_PARTY;
        }
        if (!state.units || !state.units.length) return {
          ok: false,
          reason: '보유한 유닛 없음'
        };
        var scored = state.units.map(function (u) {
          return {
            uid: u.uid,
            unit: u,
            power: computePower(u)
          };
        });
        var n = Math.min(size, scored.length);
        var candidates = [];

        // 1) 기준선 — 전투력 상위만.
        var baseline = scored.slice().sort(function (a, b) {
          return b.power - a.power;
        }).slice(0, n);
        candidates.push(baseline);

        // 2) 삼위일체 — 3원형 모두 owned라면 각 원형 최강 1명씩을 우선 앉히고 나머지는 전투력 순.
        var byArch = {};
        for (var _iterator3 = _createForOfIteratorHelperLoose(scored), _step3; !(_step3 = _iterator3()).done;) {
          var _x$unit$archetype;
          var x = _step3.value;
          (byArch[_x$unit$archetype = x.unit.archetype] || (byArch[_x$unit$archetype] = [])).push(x);
        }
        for (var _i = 0, _Object$keys = Object.keys(byArch); _i < _Object$keys.length; _i++) {
          var k = _Object$keys[_i];
          byArch[k].sort(function (a, b) {
            return b.power - a.power;
          });
        }
        if (SYNERGY_ARCHETYPES.every(function (a) {
          var _byArch$a;
          return (_byArch$a = byArch[a]) == null ? void 0 : _byArch$a.length;
        })) {
          var anchors = SYNERGY_ARCHETYPES.map(function (a) {
            return byArch[a][0];
          });
          candidates.push(fillToSize(anchors, scored, n));
        }

        // 3) 원형 집중 — 특정 원형 3명 이상 보유 시, 그 원형 최강 3명을 앉히고 나머지는 전투력 순.
        for (var _iterator4 = _createForOfIteratorHelperLoose(SYNERGY_ARCHETYPES), _step4; !(_step4 = _iterator4()).done;) {
          var _byArch$a2;
          var a = _step4.value;
          if ((((_byArch$a2 = byArch[a]) == null ? void 0 : _byArch$a2.length) || 0) >= 3) {
            candidates.push(fillToSize(byArch[a].slice(0, 3), scored, n));
          }
        }

        // 4) 속성 결속 — 가장 많이 겹치는 속성의 최강 그룹(최대 4명)을 앉히고 나머지는 전투력 순.
        var byElem = {};
        for (var _iterator5 = _createForOfIteratorHelperLoose(scored), _step5; !(_step5 = _iterator5()).done;) {
          var _x2$unit$element;
          var _x2 = _step5.value;
          if (_x2.unit.element) (byElem[_x2$unit$element = _x2.unit.element] || (byElem[_x2$unit$element] = [])).push(_x2);
        }
        for (var _i2 = 0, _Object$keys2 = Object.keys(byElem); _i2 < _Object$keys2.length; _i2++) {
          var _k = _Object$keys2[_i2];
          byElem[_k].sort(function (a, b) {
            return b.power - a.power;
          });
        }
        var dominantElem = Object.keys(byElem).sort(function (a, b) {
          return byElem[b].length - byElem[a].length;
        })[0];
        if (dominantElem && byElem[dominantElem].length >= 2) {
          candidates.push(fillToSize(byElem[dominantElem].slice(0, 4), scored, n));
        }

        // 5) 오색 결속 — 서로 다른 속성을 최대한 모아 앉히고, 남는 슬롯은 속성 중복을 피해 채운다.
        var distinctElems = Object.keys(byElem);
        if (distinctElems.length >= 3) {
          var rainbow = distinctElems.map(function (e) {
            return byElem[e][0];
          });
          var used = new Set(rainbow.map(function (x) {
            return x.unit.element;
          }));
          candidates.push(fillToSize(rainbow, scored, n, function (x) {
            return x.unit.element && used.has(x.unit.element);
          }));
        }

        // 후보 중 시너지 반영 전투력이 가장 높은 조합을 채택.
        var best = null,
          bestEval = null;
        for (var _i3 = 0, _candidates = candidates; _i3 < _candidates.length; _i3++) {
          var c = _candidates[_i3];
          var ev = evalComposition(c);
          if (!bestEval || ev.score > bestEval.score) {
            best = c;
            bestEval = ev;
          }
        }
        state.party = best.map(function (x) {
          return x.uid;
        });
        return {
          ok: true,
          party: [].concat(state.party),
          synergy: bestEval.syn.list.map(function (s) {
            return s.label;
          })
        };
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/gear.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './economy.ts', './balance.ts', './rng.ts', './materials.ts'], function (exports) {
  var _createForOfIteratorHelperLoose, _extends, cclegacy, spend, BALANCE, weightedPick, spendMaterial;
  return {
    setters: [function (module) {
      _createForOfIteratorHelperLoose = module.createForOfIteratorHelperLoose;
      _extends = module.extends;
    }, function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      spend = module.spend;
    }, function (module) {
      BALANCE = module.BALANCE;
    }, function (module) {
      weightedPick = module.weightedPick;
    }, function (module) {
      spendMaterial = module.spendMaterial;
    }],
    execute: function () {
      exports({
        activeGearSets: activeGearSets,
        craftGear: craftGear,
        createGear: createGear,
        dropGear: dropGear,
        emptyGearSet: emptyGearSet,
        enchantCost: enchantCost,
        enchantGear: enchantGear,
        enchantInfo: enchantInfo,
        enhanceGear: enhanceGear,
        ensureGearSeq: ensureGearSeq,
        equipGear: equipGear,
        gearContribution: gearContribution,
        gearCraftCost: gearCraftCost,
        gearEnhanceCost: gearEnhanceCost,
        gearSetBonus: gearSetBonus,
        getBlueprint: getBlueprint,
        grantGearElementOption: grantGearElementOption,
        rerollEnchant: rerollEnchant,
        rerollGearSubs: rerollGearSubs,
        rollGearRarity: rollGearRarity,
        rollGearSubs: rollGearSubs,
        unequipGear: unequipGear
      });
      cclegacy._RF.push({}, "b22243CLWVMkpdhk087IJBj", "gear", undefined);

      // ─────────────────────────────────────────────────────────────
      // 장비 시스템 — 슬롯별 장착 + 강화로 유닛을 추가 성장시킨다.
      //   강화(각인)가 "본체 스탯 %투자"라면, 장비는 "착용형 flat 스탯 + 효과".
      //   장비도 modifiers 파이프라인의 한 소스로 합산된다.
      //
      // 슬롯: weapon(공격) · armor(생존) · accessory(효과/속도)
      // 장비 인스턴스는 unit.gear[slot] 또는 state.inventory 에 존재한다.
      // ─────────────────────────────────────────────────────────────

      // 장비 슬롯 — 3계열(무기/방어구/장신구) + 탈것. 계열은 세트/UI 그룹핑에 쓴다.
      //   ⚠ 슬롯 id는 세이브에 박히므로 기존 weapon/armor/accessory는 그대로 유지(하위호환).
      var GEAR_SLOTS = exports('GEAR_SLOTS', ['weapon', 'offhand',
      // 무기
      'helmet', 'armor', 'gloves', 'pants',
      // 방어구
      'necklace', 'earring', 'accessory', 'cloak',
      // 장신구
      'mount' // 탈것
      ]);

      // 슬롯 표시 메타 (라벨·이모지·계열). UI/드롭 요약 공용.
      var SLOT_META = exports('SLOT_META', {
        weapon: {
          label: '무기',
          emoji: '⚔️',
          cat: 'weapon'
        },
        offhand: {
          label: '보조무기',
          emoji: '🛡️',
          cat: 'weapon'
        },
        helmet: {
          label: '투구',
          emoji: '🪖',
          cat: 'armor'
        },
        armor: {
          label: '갑옷',
          emoji: '🥋',
          cat: 'armor'
        },
        gloves: {
          label: '장갑',
          emoji: '🧤',
          cat: 'armor'
        },
        pants: {
          label: '바지',
          emoji: '👖',
          cat: 'armor'
        },
        necklace: {
          label: '목걸이',
          emoji: '📿',
          cat: 'accessory'
        },
        earring: {
          label: '귀걸이',
          emoji: '💠',
          cat: 'accessory'
        },
        accessory: {
          label: '반지',
          emoji: '💍',
          cat: 'accessory'
        },
        cloak: {
          label: '망토',
          emoji: '🦋',
          cat: 'accessory'
        },
        mount: {
          label: '탈것',
          emoji: '🐎',
          cat: 'mount'
        }
      });

      // 빈 장비 세트(전 슬롯 null) — 유닛 생성/세이브 보정 공용(슬롯 목록 단일 소스).
      function emptyGearSet() {
        return Object.fromEntries(GEAR_SLOTS.map(function (s) {
          return [s, null];
        }));
      }

      // 장비 설계도(blueprint). flat=고정 스탯, effect=전투 효과.
      var GEAR_CATALOG = exports('GEAR_CATALOG', {
        // ── 무기(주) : 종류별 개성 — 검/단검/활/도끼/양손검 ──
        IRON_SWORD: {
          id: 'IRON_SWORD',
          slot: 'weapon',
          label: '강철검',
          flat: {
            atk: 120
          }
        },
        RUNE_BLADE: {
          id: 'RUNE_BLADE',
          slot: 'weapon',
          label: '룬블레이드',
          flat: {
            atk: 90
          },
          effect: {
            critChance: 0.08
          }
        },
        DAGGER: {
          id: 'DAGGER',
          slot: 'weapon',
          label: '단검',
          flat: {
            atk: 70,
            spd: 45
          },
          effect: {
            critChance: 0.06
          }
        },
        BOW: {
          id: 'BOW',
          slot: 'weapon',
          label: '장궁',
          flat: {
            atk: 110,
            spd: 15
          },
          effect: {
            critDamage: 0.15
          }
        },
        AXE: {
          id: 'AXE',
          slot: 'weapon',
          label: '전투도끼',
          flat: {
            atk: 155
          },
          effect: {
            defPierce: 0.1
          }
        },
        GREATSWORD: {
          id: 'GREATSWORD',
          slot: 'weapon',
          label: '양손대검',
          flat: {
            atk: 200
          },
          craftCost: 300
        },
        // ── 보조무기 : 방패/마도서 ──
        TOWER_SHIELD: {
          id: 'TOWER_SHIELD',
          slot: 'offhand',
          label: '타워실드',
          flat: {
            hp: 500,
            def: 45
          },
          effect: {
            dmgReduce: 0.05
          }
        },
        ARCANE_TOME: {
          id: 'ARCANE_TOME',
          slot: 'offhand',
          label: '비전서',
          flat: {
            atk: 55,
            spd: 15
          },
          effect: {
            critChance: 0.06
          }
        },
        // ── 방어구 : 투구/갑옷/장갑/바지 ──
        IRON_HELM: {
          id: 'IRON_HELM',
          slot: 'helmet',
          label: '강철투구',
          flat: {
            hp: 420,
            def: 32
          }
        },
        PLATE_ARMOR: {
          id: 'PLATE_ARMOR',
          slot: 'armor',
          label: '판금갑옷',
          flat: {
            hp: 800,
            def: 60
          }
        },
        AEGIS: {
          id: 'AEGIS',
          slot: 'armor',
          label: '이지스',
          flat: {
            hp: 500,
            def: 40
          },
          effect: {
            lifesteal: 0.12
          }
        },
        BATTLE_GLOVES: {
          id: 'BATTLE_GLOVES',
          slot: 'gloves',
          label: '전투장갑',
          flat: {
            atk: 55,
            spd: 22
          }
        },
        GREAVES: {
          id: 'GREAVES',
          slot: 'pants',
          label: '판금각반',
          flat: {
            hp: 520,
            def: 38
          }
        },
        // ── 장신구 : 목걸이/귀걸이/반지/망토 ──
        VITAL_AMULET: {
          id: 'VITAL_AMULET',
          slot: 'necklace',
          label: '생명목걸이',
          flat: {
            hp: 380,
            spd: 12
          },
          effect: {
            lifesteal: 0.08
          }
        },
        FOCUS_EARRING: {
          id: 'FOCUS_EARRING',
          slot: 'earring',
          label: '집중귀걸이',
          flat: {
            spd: 26
          },
          effect: {
            critChance: 0.08
          }
        },
        CRIT_RING: {
          id: 'CRIT_RING',
          slot: 'accessory',
          label: '치명반지',
          flat: {
            spd: 30
          },
          effect: {
            critChance: 0.12,
            critDamage: 0.3
          }
        },
        PIERCE_CHARM: {
          id: 'PIERCE_CHARM',
          slot: 'accessory',
          label: '관통부적',
          flat: {
            spd: 20
          },
          effect: {
            defPierce: 0.25
          }
        },
        SWIFT_CLOAK: {
          id: 'SWIFT_CLOAK',
          slot: 'cloak',
          label: '질풍망토',
          flat: {
            spd: 40,
            hp: 250
          },
          effect: {
            dmgReduce: 0.05
          }
        },
        // ── 신규 능력치 특화 ──
        SHADE_CLOAK: {
          id: 'SHADE_CLOAK',
          slot: 'cloak',
          label: '그림자망토',
          flat: {
            spd: 35
          },
          effect: {
            evasion: 0.10
          }
        },
        HAWK_EARRING: {
          id: 'HAWK_EARRING',
          slot: 'earring',
          label: '매눈귀걸이',
          flat: {
            spd: 18
          },
          effect: {
            accuracy: 0.15
          }
        },
        VOID_EDGE: {
          id: 'VOID_EDGE',
          slot: 'weapon',
          label: '공허검',
          flat: {
            atk: 120
          },
          effect: {
            trueDamage: 0.12
          },
          craftCost: 400
        },
        GUARDIAN_WALL: {
          id: 'GUARDIAN_WALL',
          slot: 'offhand',
          label: '수호벽',
          flat: {
            hp: 460,
            def: 40
          },
          effect: {
            absDef: 0.10
          },
          craftCost: 400
        },
        // ── 탈것 : 기동 + 소폭 생존 ──
        WAR_STEED: {
          id: 'WAR_STEED',
          slot: 'mount',
          label: '군마',
          flat: {
            spd: 55,
            hp: 350,
            atk: 30
          }
        },
        // ── P1 상위 티어 (제작 비용↑, 콘텐츠 진행 후 노림) · 용사 세트 ──
        DRAGON_FANG: {
          id: 'DRAGON_FANG',
          slot: 'weapon',
          label: '용아검',
          flat: {
            atk: 180
          },
          effect: {
            critChance: 0.1
          },
          craftCost: 600,
          set: 'CHAMPION'
        },
        BULWARK_PLATE: {
          id: 'BULWARK_PLATE',
          slot: 'armor',
          label: '성벽갑옷',
          flat: {
            hp: 1100,
            def: 85
          },
          effect: {},
          craftCost: 600,
          set: 'CHAMPION'
        },
        OMNI_CHARM: {
          id: 'OMNI_CHARM',
          slot: 'accessory',
          label: '만능부적',
          flat: {
            spd: 35
          },
          effect: {
            critChance: 0.1,
            defPierce: 0.15
          },
          craftCost: 600,
          set: 'CHAMPION'
        },
        VALIANT_HELM: {
          id: 'VALIANT_HELM',
          slot: 'helmet',
          label: '용사투구',
          flat: {
            hp: 650,
            def: 55
          },
          effect: {
            dmgReduce: 0.04
          },
          craftCost: 600,
          set: 'CHAMPION'
        },
        VALIANT_CLOAK: {
          id: 'VALIANT_CLOAK',
          slot: 'cloak',
          label: '용사망토',
          flat: {
            spd: 45,
            hp: 400
          },
          effect: {
            dmgReduce: 0.06
          },
          craftCost: 600,
          set: 'CHAMPION'
        },
        // ── 광전사 세트(딜러) ──
        RAGE_BLADE: {
          id: 'RAGE_BLADE',
          slot: 'weapon',
          label: '광란검',
          flat: {
            atk: 135
          },
          effect: {
            critChance: 0.06
          },
          craftCost: 500,
          set: 'BERSERKER'
        },
        RAGE_GAUNTLET: {
          id: 'RAGE_GAUNTLET',
          slot: 'gloves',
          label: '광란건틀릿',
          flat: {
            atk: 65,
            spd: 22
          },
          craftCost: 500,
          set: 'BERSERKER'
        },
        RAGE_MANTLE: {
          id: 'RAGE_MANTLE',
          slot: 'cloak',
          label: '광란망토',
          flat: {
            spd: 38
          },
          effect: {
            critDamage: 0.15
          },
          craftCost: 500,
          set: 'BERSERKER'
        },
        // ── 수호 세트(탱커) ──
        BASTION_HELM: {
          id: 'BASTION_HELM',
          slot: 'helmet',
          label: '수호투구',
          flat: {
            hp: 560,
            def: 46
          },
          craftCost: 500,
          set: 'BASTION'
        },
        BASTION_WALL: {
          id: 'BASTION_WALL',
          slot: 'offhand',
          label: '수호방벽',
          flat: {
            hp: 620,
            def: 56
          },
          effect: {
            dmgReduce: 0.05
          },
          craftCost: 500,
          set: 'BASTION'
        },
        BASTION_LEGS: {
          id: 'BASTION_LEGS',
          slot: 'pants',
          label: '수호각반',
          flat: {
            hp: 600,
            def: 46
          },
          craftCost: 500,
          set: 'BASTION'
        },
        // ── 현자 세트(서포터) ──
        SAGE_PENDANT: {
          id: 'SAGE_PENDANT',
          slot: 'necklace',
          label: '현자펜던트',
          flat: {
            spd: 22,
            hp: 300
          },
          effect: {
            lifesteal: 0.08
          },
          craftCost: 500,
          set: 'ARCANIST'
        },
        SAGE_STUD: {
          id: 'SAGE_STUD',
          slot: 'earring',
          label: '현자귀걸이',
          flat: {
            spd: 28
          },
          effect: {
            critChance: 0.07
          },
          craftCost: 500,
          set: 'ARCANIST'
        },
        SPIRIT_MOUNT: {
          id: 'SPIRIT_MOUNT',
          slot: 'mount',
          label: '정령마',
          flat: {
            spd: 60,
            hp: 320
          },
          craftCost: 500,
          set: 'ARCANIST'
        }
      });

      // 장비 세트 — 같은 세트를 여러 슬롯에 착용하면 조건부 보너스(룬 세트와 유사).
      var GEAR_SETS = exports('GEAR_SETS', {
        CHAMPION: {
          label: '용사',
          two: {
            statPct: {
              atk: 0.08
            }
          },
          // 2피스
          three: {
            statPct: {
              atk: 0.15
            },
            effect: {
              critChance: 0.1
            }
          } // 3피스(풀세트)
        },

        // ── 역할 지향 세트 3종 ──
        BERSERKER: {
          label: '광전사',
          // 딜러
          two: {
            statPct: {
              atk: 0.10
            }
          },
          three: {
            statPct: {
              atk: 0.18
            },
            effect: {
              critDamage: 0.25
            }
          }
        },
        BASTION: {
          label: '수호',
          // 탱커
          two: {
            statPct: {
              hp: 0.12,
              def: 0.10
            }
          },
          three: {
            statPct: {
              hp: 0.18,
              def: 0.15
            },
            effect: {
              dmgReduce: 0.10
            }
          }
        },
        ARCANIST: {
          label: '현자',
          // 서포터
          two: {
            statPct: {
              spd: 0.12
            }
          },
          three: {
            statPct: {
              spd: 0.18,
              atk: 0.08
            },
            effect: {
              lifesteal: 0.10
            }
          }
        }
      });

      // 유닛 장착 장비의 세트 보너스 합산 (2/3피스 임계).
      function gearSetBonus(unit) {
        var counts = {};
        for (var _iterator = _createForOfIteratorHelperLoose(GEAR_SLOTS), _step; !(_step = _iterator()).done;) {
          var slot = _step.value;
          var it = unit.gear && unit.gear[slot];
          var _set = it && GEAR_CATALOG[it.blueprint] && GEAR_CATALOG[it.blueprint].set;
          if (_set) counts[_set] = (counts[_set] || 0) + 1;
        }
        var out = {
          statPct: {},
          effect: {}
        };
        for (var _i = 0, _Object$entries = Object.entries(counts); _i < _Object$entries.length; _i++) {
          var _Object$entries$_i = _Object$entries[_i],
            set = _Object$entries$_i[0],
            n = _Object$entries$_i[1];
          var def = GEAR_SETS[set];
          if (!def) continue;
          var tier = n >= 3 ? def.three : n >= 2 ? def.two : null;
          if (!tier) continue;
          for (var _i2 = 0, _Object$entries2 = Object.entries(tier.statPct || {}); _i2 < _Object$entries2.length; _i2++) {
            var _Object$entries2$_i = _Object$entries2[_i2],
              k = _Object$entries2$_i[0],
              v = _Object$entries2$_i[1];
            out.statPct[k] = (out.statPct[k] || 0) + v;
          }
          for (var _i3 = 0, _Object$entries3 = Object.entries(tier.effect || {}); _i3 < _Object$entries3.length; _i3++) {
            var _Object$entries3$_i = _Object$entries3[_i3],
              _k = _Object$entries3$_i[0],
              _v = _Object$entries3$_i[1];
            out.effect[_k] = (out.effect[_k] || 0) + _v;
          }
        }
        return out;
      }

      // 유닛의 활성 세트 목록 (표시용): [{ set, label, pieces, active2, active3 }]
      function activeGearSets(unit) {
        var counts = {};
        for (var _iterator2 = _createForOfIteratorHelperLoose(GEAR_SLOTS), _step2; !(_step2 = _iterator2()).done;) {
          var slot = _step2.value;
          var it = unit.gear && unit.gear[slot];
          var set = it && GEAR_CATALOG[it.blueprint] && GEAR_CATALOG[it.blueprint].set;
          if (set) counts[set] = (counts[set] || 0) + 1;
        }
        return Object.entries(counts).filter(function (_ref) {
          var set = _ref[0],
            n = _ref[1];
          return GEAR_SETS[set] && n >= 2;
        }).map(function (_ref2) {
          var set = _ref2[0],
            n = _ref2[1];
          return {
            set: set,
            label: GEAR_SETS[set].label,
            pieces: n,
            active2: n >= 2,
            active3: n >= 3
          };
        });
      }
      var GEAR_ENH_PER = 0.12; // 강화 레벨당 flat +12%

      // ── 장비 등급 + 부옵션 ────────────────────────────────────────
      // 등급이 기본 flat 배수와 부옵션(substat) 개수를 정한다. 등급 없는
      // 레거시 아이템은 배수 1.0(=N)으로 취급 → 기존 세이브 파워 불변.
      var GEAR_RARITY = exports('GEAR_RARITY', {
        N: {
          id: 'N',
          mult: 1.00,
          subs: 0,
          weight: 40,
          label: '노멀'
        },
        R: {
          id: 'R',
          mult: 1.15,
          subs: 1,
          weight: 32,
          label: '레어'
        },
        SR: {
          id: 'SR',
          mult: 1.35,
          subs: 2,
          weight: 18,
          label: '에픽'
        },
        SSR: {
          id: 'SSR',
          mult: 1.60,
          subs: 3,
          weight: 8,
          label: '전설'
        },
        UR: {
          id: 'UR',
          mult: 1.90,
          subs: 4,
          weight: 2,
          label: '신화'
        }
      });

      // 부옵션 풀 — statPct(자기 스탯%) 또는 effect(전투 효과). [min,max] 롤 범위.
      var SUBSTAT_POOL = [{
        key: 'atk',
        kind: 'statPct',
        min: 0.04,
        max: 0.10
      }, {
        key: 'hp',
        kind: 'statPct',
        min: 0.04,
        max: 0.10
      }, {
        key: 'def',
        kind: 'statPct',
        min: 0.04,
        max: 0.10
      }, {
        key: 'spd',
        kind: 'statPct',
        min: 0.04,
        max: 0.10
      }, {
        key: 'critChance',
        kind: 'effect',
        min: 0.03,
        max: 0.08
      }, {
        key: 'critDamage',
        kind: 'effect',
        min: 0.08,
        max: 0.20
      }, {
        key: 'lifesteal',
        kind: 'effect',
        min: 0.04,
        max: 0.10
      }, {
        key: 'defPierce',
        kind: 'effect',
        min: 0.05,
        max: 0.12
      }, {
        key: 'dmgReduce',
        kind: 'effect',
        min: 0.03,
        max: 0.08
      }, {
        key: 'evasion',
        kind: 'effect',
        min: 0.03,
        max: 0.08
      }, {
        key: 'accuracy',
        kind: 'effect',
        min: 0.05,
        max: 0.12
      }, {
        key: 'trueDamage',
        kind: 'effect',
        min: 0.04,
        max: 0.10
      }, {
        key: 'absDef',
        kind: 'effect',
        min: 0.03,
        max: 0.08
      }];
      function rollSub(rng) {
        var p = SUBSTAT_POOL[Math.floor(rng() * SUBSTAT_POOL.length)];
        var v = p.min + rng() * (p.max - p.min);
        return {
          key: p.key,
          kind: p.kind,
          value: Math.round(v * 1000) / 1000
        };
      }
      // 등급별 부옵션 개수만큼 중복 키 없이 롤.
      function rollGearSubs(rarity, rng) {
        var n = GEAR_RARITY[rarity] && GEAR_RARITY[rarity].subs || 0;
        var subs = [];
        var used = new Set();
        var guard = 0;
        while (subs.length < n && guard++ < 30) {
          var s = rollSub(rng);
          if (used.has(s.key)) continue;
          used.add(s.key);
          subs.push(s);
        }
        return subs;
      }
      // 드롭 등급 롤 — luck(0~1)이 높을수록 상위 등급 가중↑ (진행도 비례).
      function rollGearRarity(rng, luck) {
        if (luck === void 0) {
          luck = 0;
        }
        var entries = Object.values(GEAR_RARITY).map(function (d) {
          return {
            weight: d.weight * (d.id === 'UR' ? 1 + luck * 4 : d.id === 'SSR' ? 1 + luck * 2 : 1),
            id: d.id
          };
        });
        return weightedPick(entries, rng).id;
      }
      function getBlueprint(id) {
        var b = GEAR_CATALOG[id];
        if (!b) throw new Error("\uC54C \uC218 \uC5C6\uB294 \uC7A5\uBE44: " + id);
        return b;
      }
      var _gseq = 0;
      function ensureGearSeq(n) {
        if (n > _gseq) _gseq = n;
      }

      // rarity/rng 주면 등급+부옵션 아이템 생성(드롭·제작). 없으면 레거시(등급없음).
      function createGear(blueprintId, _temp) {
        var _ref3 = _temp === void 0 ? {} : _temp,
          rarity = _ref3.rarity,
          rng = _ref3.rng;
        var b = getBlueprint(blueprintId);
        var item = {
          uid: "g" + ++_gseq,
          blueprint: blueprintId,
          slot: b.slot,
          level: 1
        };
        if (rarity) {
          item.rarity = rarity;
          item.subs = rng ? rollGearSubs(rarity, rng) : [];
        }
        return item;
      }

      // ── 인챈트(마법부여) — 장비에 각인하는 성장형 효과. 전 슬롯(탈것 포함) 적용. ──
      //   첫 인챈트는 무작위 효과를 1레벨로 부여, 이후 같은 효과를 레벨업(강도↑).
      //   속성정수(마법 재료)로 부여·강화, 다이아로 효과 재추첨(reroll).
      var ENCHANT_MAX = exports('ENCHANT_MAX', 5);
      var ENCHANT_POOL = exports('ENCHANT_POOL', [{
        key: 'atk',
        kind: 'statPct',
        per: 0.02,
        label: '공격'
      }, {
        key: 'hp',
        kind: 'statPct',
        per: 0.02,
        label: '체력'
      }, {
        key: 'def',
        kind: 'statPct',
        per: 0.02,
        label: '방어'
      }, {
        key: 'spd',
        kind: 'statPct',
        per: 0.02,
        label: '속도'
      }, {
        key: 'critChance',
        kind: 'effect',
        per: 0.015,
        label: '치명확률'
      }, {
        key: 'critDamage',
        kind: 'effect',
        per: 0.04,
        label: '치명피해'
      }, {
        key: 'lifesteal',
        kind: 'effect',
        per: 0.02,
        label: '흡혈'
      }, {
        key: 'defPierce',
        kind: 'effect',
        per: 0.025,
        label: '관통'
      }, {
        key: 'dmgReduce',
        kind: 'effect',
        per: 0.015,
        label: '피해감소'
      }, {
        key: 'evasion',
        kind: 'effect',
        per: 0.015,
        label: '회피'
      }, {
        key: 'accuracy',
        kind: 'effect',
        per: 0.025,
        label: '명중'
      }, {
        key: 'trueDamage',
        kind: 'effect',
        per: 0.02,
        label: '절대공격'
      }, {
        key: 'absDef',
        kind: 'effect',
        per: 0.015,
        label: '절대방어'
      }]);
      function enchantDef(key) {
        return ENCHANT_POOL.find(function (e) {
          return e.key === key;
        }) || null;
      }

      // 인챈트 현황(표시용): { key, kind, level, per, label, value } 또는 null.
      function enchantInfo(item) {
        if (!item || !item.enchant) return null;
        var d = enchantDef(item.enchant.key);
        if (!d) return null;
        return _extends({}, d, {
          level: item.enchant.level,
          value: Math.round(d.per * item.enchant.level * 1000) / 1000
        });
      }
      // 현재 인챈트 레벨(0=없음) 기준 다음 강화 비용.
      function enchantCost(level) {
        return {
          elemEssence: 2 + level * 2
        };
      }
      function enchantGear(state, gearUid, rng) {
        if (rng === void 0) {
          rng = Math.random;
        }
        var item = findGearAnywhere(state, gearUid);
        if (!item) return {
          ok: false,
          reason: '장비 없음'
        };
        var cur = item.enchant ? item.enchant.level : 0;
        if (cur >= ENCHANT_MAX) return {
          ok: false,
          reason: "\uC778\uCC48\uD2B8 \uC0C1\uD55C " + ENCHANT_MAX
        };
        var cost = enchantCost(cur);
        if (!spendMaterial(state, 'elemEssence', cost.elemEssence)) return {
          ok: false,
          reason: '속성정수 부족',
          cost: cost
        };
        if (!item.enchant) {
          var p = ENCHANT_POOL[Math.floor(rng() * ENCHANT_POOL.length)];
          item.enchant = {
            key: p.key,
            kind: p.kind,
            level: 1
          };
        } else {
          item.enchant.level += 1;
        }
        return {
          ok: true,
          enchant: item.enchant,
          info: enchantInfo(item),
          cost: cost
        };
      }
      // 효과 재추첨 — 레벨 유지, 효과 종류만 다이아로 다시 뽑는다.
      function rerollEnchant(state, gearUid, rng) {
        if (rng === void 0) {
          rng = Math.random;
        }
        var item = findGearAnywhere(state, gearUid);
        if (!item || !item.enchant) return {
          ok: false,
          reason: '인챈트 없음'
        };
        var cost = {
          gem: 25
        };
        if (!spend(state.wallet, cost)) return {
          ok: false,
          reason: '다이아 부족',
          cost: cost
        };
        var p = ENCHANT_POOL[Math.floor(rng() * ENCHANT_POOL.length)];
        item.enchant = {
          key: p.key,
          kind: p.kind,
          level: item.enchant.level
        };
        return {
          ok: true,
          enchant: item.enchant,
          info: enchantInfo(item),
          cost: cost
        };
      }

      // 장비 한 점이 유닛에 주는 기여분 (강화 레벨 + 등급 배수 + 부옵션 + 인챈트 반영).
      function gearContribution(gearItem) {
        var b = getBlueprint(gearItem.blueprint);
        var rmult = GEAR_RARITY[gearItem.rarity] && GEAR_RARITY[gearItem.rarity].mult || 1.0;
        var scale = (1 + GEAR_ENH_PER * (gearItem.level - 1)) * rmult;
        var flat = {};
        for (var _i4 = 0, _arr = Object.entries(b.flat || {}); _i4 < _arr.length; _i4++) {
          var _arr$_i = _arr[_i4],
            k = _arr$_i[0],
            v = _arr$_i[1];
          flat[k] = v * scale;
        }
        var statPct = {};
        var effect = _extends({}, b.effect || {});
        for (var _iterator3 = _createForOfIteratorHelperLoose(gearItem.subs || []), _step3; !(_step3 = _iterator3()).done;) {
          var s = _step3.value;
          if (s.kind === 'statPct') statPct[s.key] = (statPct[s.key] || 0) + s.value;else effect[s.key] = (effect[s.key] || 0) + s.value;
        }
        // 인챈트 기여 (statPct 또는 effect)
        var en = enchantInfo(gearItem);
        if (en) {
          if (en.kind === 'statPct') statPct[en.key] = (statPct[en.key] || 0) + en.value;else effect[en.key] = (effect[en.key] || 0) + en.value;
        }
        return {
          flat: flat,
          statPct: statPct,
          effect: effect
        };
      }

      // 아이템(장착/인벤토리) 어디서든 uid로 찾기.
      function findGearAnywhere(state, gearUid) {
        return state.inventory.find(function (g) {
          return g.uid === gearUid;
        }) || state.units.flatMap(function (u) {
          return GEAR_SLOTS.map(function (s) {
            return u.gear[s];
          });
        }).find(function (g) {
          return g && g.uid === gearUid;
        }) || null;
      }

      // 속성정수로 부옵션 1개 추가(등급 상한을 넘어 GEAR_SUB_MAX까지 확장) — 속성 던전 사용처.
      var ELEM_OPTION_COST = exports('ELEM_OPTION_COST', 5);
      var GEAR_SUB_MAX = exports('GEAR_SUB_MAX', 6);
      function grantGearElementOption(state, gearUid, rng) {
        if (rng === void 0) {
          rng = Math.random;
        }
        var item = findGearAnywhere(state, gearUid);
        if (!item) return {
          ok: false,
          reason: '장비 없음'
        };
        item.subs = item.subs || [];
        if (item.subs.length >= GEAR_SUB_MAX) return {
          ok: false,
          reason: "\uBD80\uC635\uC158 \uC0C1\uD55C " + GEAR_SUB_MAX
        };
        if (!spendMaterial(state, 'elemEssence', ELEM_OPTION_COST)) return {
          ok: false,
          reason: '속성정수 부족',
          cost: ELEM_OPTION_COST
        };
        var used = new Set(item.subs.map(function (s) {
          return s.key;
        }));
        var guard = 0,
          added = null;
        while (guard++ < 30) {
          var s = rollSub(rng);
          if (used.has(s.key)) continue;
          item.subs.push(s);
          added = s;
          break;
        }
        return {
          ok: true,
          sub: added,
          subs: item.subs
        };
      }

      // 부옵션 재련 — 다이아 소모, 등급 개수만큼 부옵션 재롤.
      function rerollGearSubs(state, gearUid, rng) {
        if (rng === void 0) {
          rng = Math.random;
        }
        var item = findGearAnywhere(state, gearUid);
        if (!item) return {
          ok: false,
          reason: '장비 없음'
        };
        if (!item.rarity || !(GEAR_RARITY[item.rarity] && GEAR_RARITY[item.rarity].subs)) {
          return {
            ok: false,
            reason: '부옵션 없는 장비'
          };
        }
        var cost = {
          gem: 20
        };
        if (!spend(state.wallet, cost)) return {
          ok: false,
          reason: '다이아 부족',
          cost: cost
        };
        item.subs = rollGearSubs(item.rarity, rng);
        return {
          ok: true,
          subs: item.subs,
          cost: cost
        };
      }

      // 장비 강화 비용 (currency).
      function gearEnhanceCost(level) {
        return {
          currency: Math.round(BALANCE.gearCostBase * Math.pow(BALANCE.gearCostGrowth, level - 1))
        };
      }

      // ── 액션 (장르 무관) ──────────────────────────────────────────

      // 설계도로 장비를 제작해 인벤토리에 넣는다.
      function gearCraftCost(blueprintId) {
        return {
          currency: getBlueprint(blueprintId).craftCost || 150
        };
      }
      function craftGear(state, blueprintId, rng) {
        if (rng === void 0) {
          rng = Math.random;
        }
        var cost = gearCraftCost(blueprintId);
        if (!spend(state.wallet, cost)) return {
          ok: false,
          reason: '제작 재화 부족',
          cost: cost
        };
        // 제작품은 레어(R) 기본 — 부옵션 1개. 드롭은 등급이 굴려짐(dropGear).
        var item = createGear(blueprintId, {
          rarity: 'R',
          rng: rng
        });
        state.inventory.push(item);
        return {
          ok: true,
          item: item
        };
      }

      // 드롭 — 랜덤 설계도 + 등급 롤로 아이템 생성해 인벤토리에 넣는다(던전/상자).
      function dropGear(state, rng, luck, slot) {
        if (rng === void 0) {
          rng = Math.random;
        }
        if (luck === void 0) {
          luck = 0;
        }
        if (slot === void 0) {
          slot = null;
        }
        var pool = Object.values(GEAR_CATALOG).filter(function (b) {
          return !slot || b.slot === slot;
        });
        var b = pool[Math.floor(rng() * pool.length)];
        var rarity = rollGearRarity(rng, luck);
        var item = createGear(b.id, {
          rarity: rarity,
          rng: rng
        });
        state.inventory.push(item);
        return {
          ok: true,
          item: item,
          rarity: rarity
        };
      }
      function findUnit(state, uid) {
        var u = state.units.find(function (x) {
          return x.uid === uid;
        });
        if (!u) throw new Error("\uC720\uB2DB \uC5C6\uC74C: " + uid);
        return u;
      }

      // 인벤토리의 장비를 유닛 슬롯에 장착 (기존 장비는 인벤토리로 반환).
      function equipGear(state, unitUid, gearUid) {
        var unit = findUnit(state, unitUid);
        var idx = state.inventory.findIndex(function (g) {
          return g.uid === gearUid;
        });
        if (idx === -1) return {
          ok: false,
          reason: '인벤토리에 없는 장비'
        };
        var item = state.inventory[idx];
        var slot = item.slot;
        var prev = unit.gear[slot];
        state.inventory.splice(idx, 1);
        if (prev) state.inventory.push(prev); // 기존 장비 회수
        unit.gear[slot] = item;
        return {
          ok: true,
          slot: slot,
          equipped: item.uid,
          unequipped: (prev == null ? void 0 : prev.uid) || null
        };
      }
      function unequipGear(state, unitUid, slot) {
        var unit = findUnit(state, unitUid);
        var item = unit.gear[slot];
        if (!item) return {
          ok: false,
          reason: '빈 슬롯'
        };
        unit.gear[slot] = null;
        state.inventory.push(item);
        return {
          ok: true,
          unequipped: item.uid
        };
      }

      // 장착/보유 장비를 강화.
      function enhanceGear(state, gearUid) {
        var item = state.inventory.find(function (g) {
          return g.uid === gearUid;
        }) || state.units.flatMap(function (u) {
          return GEAR_SLOTS.map(function (s) {
            return u.gear[s];
          });
        }).find(function (g) {
          return g && g.uid === gearUid;
        });
        if (!item) return {
          ok: false,
          reason: '장비 없음'
        };
        var cost = gearEnhanceCost(item.level);
        if (!spend(state.wallet, cost)) return {
          ok: false,
          reason: '강화 재화 부족',
          cost: cost
        };
        item.level += 1;
        return {
          ok: true,
          gear: item.uid,
          level: item.level,
          cost: cost
        };
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/gearcarry.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './gear.ts', './formation.ts'], function (exports) {
  var _createForOfIteratorHelperLoose, cclegacy, GEAR_SLOTS, unitRole, setFormation;
  return {
    setters: [function (module) {
      _createForOfIteratorHelperLoose = module.createForOfIteratorHelperLoose;
    }, function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      GEAR_SLOTS = module.GEAR_SLOTS;
    }, function (module) {
      unitRole = module.unitRole;
      setFormation = module.setFormation;
    }],
    execute: function () {
      exports({
        inheritGear: inheritGear,
        swapPartyMember: swapPartyMember
      });
      cclegacy._RF.push({}, "3ba11JVi6dDnq2lEokwcQ0B", "gearcarry", undefined);

      // ─────────────────────────────────────────────────────────────
      // 장비 전승 — "슬롯(자리) 기반 장비"의 실사용 효용을 안전하게 제공.
      //   트렌드 의도: 캐릭터를 교체해도 장비를 다시 빼고 낄 필요가 없어야 한다.
      //   데이터 모델(unit.gear)은 그대로 두고, "자리 교체 시 장비를 승계"하는
      //   편의 액션으로 동일 효용을 낸다(전투 엔진·세이브 무변경 → 저위험).
      // ─────────────────────────────────────────────────────────────

      function findUnit(state, uid) {
        return (state.units || []).find(function (u) {
          return u.uid === uid;
        });
      }

      // 나가는 유닛의 장착 장비를 들어오는 유닛으로 이전.
      //   들어오는 유닛의 기존 장비는 소실 없이 인벤토리로 회수한다.
      function inheritGear(state, fromUid, toUid) {
        var from = findUnit(state, fromUid);
        var to = findUnit(state, toUid);
        if (!from || !to) return {
          ok: false,
          reason: '유닛 없음'
        };
        if (fromUid === toUid) return {
          ok: false,
          reason: '같은 유닛'
        };
        var moved = 0;
        for (var _iterator = _createForOfIteratorHelperLoose(GEAR_SLOTS), _step; !(_step = _iterator()).done;) {
          var slot = _step.value;
          var item = from.gear ? from.gear[slot] : null;
          if (!item) continue;
          var displaced = to.gear[slot];
          if (displaced) state.inventory.push(displaced); // 기존 장비 회수(소실 없음)
          to.gear[slot] = item;
          from.gear[slot] = null;
          moved += 1;
        }
        return {
          ok: true,
          moved: moved
        };
      }

      // 파티 자리 교체 — out을 in으로 같은 인덱스에서 교체하고,
      //   진형 역할과 장비를 그대로 승계(재장착 노동 제거).
      //   carryGear=false면 진형만 승계.
      function swapPartyMember(state, outUid, inUid, _temp) {
        var _ref = _temp === void 0 ? {} : _temp,
          _ref$carryGear = _ref.carryGear,
          carryGear = _ref$carryGear === void 0 ? true : _ref$carryGear;
        var idx = (state.party || []).indexOf(outUid);
        if (idx === -1) return {
          ok: false,
          reason: '편성되지 않은 유닛(out)'
        };
        if (state.party.includes(inUid)) return {
          ok: false,
          reason: '이미 편성된 유닛(in)'
        };
        if (!findUnit(state, inUid)) return {
          ok: false,
          reason: '보유하지 않은 유닛(in)'
        };
        var role = unitRole(state, outUid);
        var moved = 0;
        if (carryGear) moved = inheritGear(state, outUid, inUid).moved || 0;
        // 자리 교체.
        state.party[idx] = inUid;
        // 진형 역할 승계 후 out 참조 정리.
        if (state.formation) delete state.formation[outUid];
        setFormation(state, inUid, role);
        return {
          ok: true,
          index: idx,
          role: role,
          gearMoved: moved
        };
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/gearsalvage.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './economy.ts'], function (exports) {
  var _createForOfIteratorHelperLoose, cclegacy, earn;
  return {
    setters: [function (module) {
      _createForOfIteratorHelperLoose = module.createForOfIteratorHelperLoose;
    }, function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      earn = module.earn;
    }],
    execute: function () {
      exports({
        autoSalvage: autoSalvage,
        salvageTargets: salvageTargets
      });
      cclegacy._RF.push({}, "6bdb2Dy98lI2pGrBawy9Xnr", "gearsalvage", undefined);
      var RANK = {
        N: 0,
        R: 1,
        SR: 2,
        SSR: 3,
        UR: 4
      };
      // 등급별 분해 환급(소프트 재화). 상급일수록 값이 크지만 자동 대상은 보통 N/R.
      var SALVAGE_VALUE = exports('SALVAGE_VALUE', {
        N: 20,
        R: 50,
        SR: 120,
        SSR: 300,
        UR: 800
      });

      // 자동 분해 대상: 등급이 임계 이하 & 강화(레벨1) 안 하고 인챈트 없는 순수 드롭.
      function salvageTargets(state, maxRarity) {
        var cap = RANK[maxRarity];
        if (cap == null) return [];
        return (state.inventory || []).filter(function (it) {
          return it.rarity && RANK[it.rarity] <= cap && (it.level || 1) === 1 && !it.enchant;
        });
      }

      // 임계 이하 하급 장비를 일괄 분해하고 재화를 환급한다.
      function autoSalvage(state, maxRarity) {
        var targets = salvageTargets(state, maxRarity);
        if (!targets.length) return {
          ok: false,
          removed: 0,
          refund: {}
        };
        var uids = new Set(targets.map(function (t) {
          return t.uid;
        }));
        var currency = 0;
        for (var _iterator = _createForOfIteratorHelperLoose(targets), _step; !(_step = _iterator()).done;) {
          var it = _step.value;
          currency += SALVAGE_VALUE[it.rarity] || 0;
        }
        state.inventory = (state.inventory || []).filter(function (it) {
          return !uids.has(it.uid);
        });
        var refund = {
          currency: currency
        };
        earn(state.wallet, refund);
        return {
          ok: true,
          removed: targets.length,
          refund: refund
        };
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/guardians.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './economy.ts', './rng.ts'], function (exports) {
  var _createForOfIteratorHelperLoose, cclegacy, spend, weightedPick;
  return {
    setters: [function (module) {
      _createForOfIteratorHelperLoose = module.createForOfIteratorHelperLoose;
    }, function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      spend = module.spend;
    }, function (module) {
      weightedPick = module.weightedPick;
    }],
    execute: function () {
      exports({
        equipGuardian: equipGuardian,
        guardianEffectLabel: guardianEffectLabel,
        guardianMods: guardianMods,
        guardianSummon: guardianSummon,
        unequipGuardian: unequipGuardian
      });
      cclegacy._RF.push({}, "776d4VY5PFDOZTWkXANL1xB", "guardians", undefined);

      // ─────────────────────────────────────────────────────────────
      // 정령/가디언 — 계정 소환수. 장착(최대 3)한 정령만 계정 배수에 합산.
      //   · 다이아로 소환, 중복은 레벨업(강해짐) — 펫과 유사하나 축이 "전투 보조"에 집중.
      //   · 대부분 power(전투력)이며 일부는 자원(currency/growth) 보조.
      //   accountMods가 이 배수를 전 유닛/수입에 곱한다.
      // ─────────────────────────────────────────────────────────────

      var GUARDIANS = exports('GUARDIANS', {
        G_SALAMANDER: {
          id: 'G_SALAMANDER',
          kind: 'power',
          per: 0.05,
          rarity: 'R',
          emoji: '🦎',
          label: '불도마뱀'
        },
        G_UNDINE: {
          id: 'G_UNDINE',
          kind: 'currency',
          per: 0.06,
          rarity: 'R',
          emoji: '💧',
          label: '물의 정령'
        },
        G_SYLPH: {
          id: 'G_SYLPH',
          kind: 'growth',
          per: 0.06,
          rarity: 'R',
          emoji: '🌬️',
          label: '바람 정령'
        },
        G_GOLEM: {
          id: 'G_GOLEM',
          kind: 'power',
          per: 0.08,
          rarity: 'SR',
          emoji: '🗿',
          label: '대지 골렘'
        },
        G_KELPIE: {
          id: 'G_KELPIE',
          kind: 'currency',
          per: 0.09,
          rarity: 'SR',
          emoji: '🐴',
          label: '켈피'
        },
        G_PHOENIX: {
          id: 'G_PHOENIX',
          kind: 'power',
          per: 0.12,
          rarity: 'SSR',
          emoji: '🔥',
          label: '불사조령'
        }
      });
      var MAX_ACTIVE_GUARDIANS = exports('MAX_ACTIVE_GUARDIANS', 3);
      var GUARDIAN_SUMMON_COST = exports('GUARDIAN_SUMMON_COST', {
        gem: 40
      });
      var GUARD_RARITY = [{
        id: 'R',
        weight: 68
      }, {
        id: 'SR',
        weight: 26
      }, {
        id: 'SSR',
        weight: 6
      }];
      function ensure(state) {
        state.guardians = state.guardians || {
          owned: {},
          active: []
        };
        state.guardians.owned = state.guardians.owned || {};
        state.guardians.active = state.guardians.active || [];
        return state.guardians;
      }

      // 소환 — 다이아 소모, 등급 확률로 획득(중복은 레벨업). 빈 슬롯이면 자동 장착.
      function guardianSummon(state, rng) {
        if (rng === void 0) {
          rng = Math.random;
        }
        if (!spend(state.wallet, GUARDIAN_SUMMON_COST)) return {
          ok: false,
          reason: '다이아 부족',
          cost: GUARDIAN_SUMMON_COST
        };
        var g = ensure(state);
        var rarity = weightedPick(GUARD_RARITY, rng);
        var pool = Object.values(GUARDIANS).filter(function (x) {
          return x.rarity === rarity.id;
        });
        var from = pool.length ? pool : Object.values(GUARDIANS);
        var pick = from[Math.floor(rng() * from.length)];
        g.owned[pick.id] = (g.owned[pick.id] || 0) + 1;
        if (g.active.length < MAX_ACTIVE_GUARDIANS && !g.active.includes(pick.id)) g.active.push(pick.id);
        return {
          ok: true,
          guardian: pick.id,
          rarity: rarity.id,
          level: g.owned[pick.id]
        };
      }
      function equipGuardian(state, id) {
        var g = ensure(state);
        if (!g.owned[id]) return {
          ok: false,
          reason: '미보유'
        };
        if (g.active.includes(id)) return {
          ok: false,
          reason: '이미 장착'
        };
        if (g.active.length >= MAX_ACTIVE_GUARDIANS) return {
          ok: false,
          reason: '슬롯 가득'
        };
        g.active.push(id);
        return {
          ok: true
        };
      }
      function unequipGuardian(state, id) {
        var g = ensure(state);
        g.active = g.active.filter(function (x) {
          return x !== id;
        });
        return {
          ok: true
        };
      }

      // 장착 정령의 계정 배수 (power / currency / growth). 없으면 전부 1.
      function guardianMods(state) {
        var power = 1,
          currency = 1,
          growth = 1;
        var g = state.guardians;
        if (!g) return {
          power: power,
          currency: currency,
          growth: growth
        };
        for (var _iterator = _createForOfIteratorHelperLoose(g.active || []), _step; !(_step = _iterator()).done;) {
          var id = _step.value;
          var def = GUARDIANS[id];
          var lv = g.owned && g.owned[id] || 0;
          if (!def || !lv) continue;
          if (def.kind === 'power') power += def.per * lv;else if (def.kind === 'currency') currency += def.per * lv;else growth += def.per * lv;
        }
        return {
          power: power,
          currency: currency,
          growth: growth
        };
      }
      function guardianEffectLabel(kind, concept) {
        if (kind === 'power') return '전투력';
        if (kind === 'currency') return (concept ? concept.resources.currency.name : '골드') + " \uC218\uC785";
        return (concept ? concept.resources.growth.name : '정수') + " \uC218\uC785";
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/guild.ts", ['cc', './units.ts', './balance.ts', './progression.ts', './gameState.ts', './economy.ts'], function (exports) {
  var cclegacy, toCombatProfile, accountMods, getStage, getPartyUnits, earn;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      toCombatProfile = module.toCombatProfile;
    }, function (module) {
      accountMods = module.accountMods;
    }, function (module) {
      getStage = module.getStage;
    }, function (module) {
      getPartyUnits = module.getPartyUnits;
    }, function (module) {
      earn = module.earn;
    }],
    execute: function () {
      exports({
        guildAttack: guildAttack,
        guildAttacksLeft: guildAttacksLeft,
        guildBossMaxHp: guildBossMaxHp
      });
      cclegacy._RF.push({}, "3cd0dszbFVAjrqHu/mhK2n2", "guild", undefined);

      // ─────────────────────────────────────────────────────────────
      // 길드 보스 레이드 — 협동 경쟁 골격(비동기).
      // 매일 정해진 횟수만큼 보스를 공격해 누적 피해를 넣는다.
      // 보스를 처치하면 티어가 오르고(=다음 보스는 더 강함) 보너스 보상.
      // 실 길드원 대신, 진행도 기반 보스 HP로 "레이드 감"을 재현한다.
      // ─────────────────────────────────────────────────────────────

      var GUILD_ATTACKS = exports('GUILD_ATTACKS', 3); // 하루 공격 횟수
      var ATTACK_SECONDS = 30; // 1회 공격 = 30초 딜
      // 보스 HP = 현재 진행 스테이지 적 HP × BOSS_HP_MULT × 티어.
      // 대략 스테이지에 맞는 파티가 티어당 며칠에 걸쳐 잡도록 조정(골격 수치).
      var BOSS_HP_MULT = 18;

      // 파티 총 DPS(계정 배수 포함) — 한 번 공격에 넣는 피해의 초당량.
      function partyDpsEff(state) {
        var party = getPartyUnits(state);
        var mult = accountMods(state).powerMult;
        var dps = party.reduce(function (s, u) {
          return s + toCombatProfile(u).dps;
        }, 0);
        return dps * mult;
      }

      // 티어별 보스 최대 HP. peakStage(진행도)와 티어가 함께 오른다.
      function guildBossMaxHp(state) {
        var tier = state.guild.tier || 1;
        return Math.round(getStage(state.peakStage).challenge.hp * BOSS_HP_MULT * tier);
      }
      function refresh(state, now) {
        var d = Math.floor(now / 86400000);
        if (state.guild.day !== d) {
          state.guild.day = d;
          state.guild.attacks = 0;
        }
        if (state.guild.bossHp === null || state.guild.bossHp === undefined) {
          state.guild.bossHp = guildBossMaxHp(state);
        }
      }
      function guildAttacksLeft(state, now) {
        if (now === void 0) {
          now = Date.now();
        }
        refresh(state, now);
        return GUILD_ATTACKS - state.guild.attacks;
      }

      // 한 번 공격. 누적 피해를 보스 HP에서 깎고, 처치 시 티어업 + 보너스.
      function guildAttack(state, now) {
        if (now === void 0) {
          now = Date.now();
        }
        if (guildAttacksLeft(state, now) <= 0) return {
          ok: false,
          reason: '오늘 공격 소진'
        };
        state.guild.attacks += 1;
        var dmg = Math.round(partyDpsEff(state) * ATTACK_SECONDS);
        state.guild.bossHp = Math.max(0, state.guild.bossHp - dmg);

        // 기여 보상: 피해량 비례 길드 코인 + 진행도 골드
        var coin = Math.max(1, Math.round(dmg / 500));
        state.guild.coins = (state.guild.coins || 0) + coin;
        var reward = {
          currency: Math.round(getStage(state.peakStage).rewards.currency * 15)
        };
        earn(state.wallet, reward);
        var killed = false,
          bonus = null;
        if (state.guild.bossHp <= 0) {
          killed = true;
          state.guild.tier += 1;
          bonus = {
            gem: 15,
            summon: 20
          };
          earn(state.wallet, bonus);
          state.guild.bossHp = guildBossMaxHp(state); // 다음 보스 등장
        }

        return {
          ok: true,
          dmg: dmg,
          killed: killed,
          bonus: bonus,
          coin: coin,
          reward: reward,
          tier: state.guild.tier,
          bossHp: state.guild.bossHp,
          bossMax: guildBossMaxHp(state)
        };
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/iap.ts", ['cc', './shop.ts'], function (exports) {
  var cclegacy, SHOP;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      SHOP = module.SHOP;
    }],
    execute: function () {
      exports({
        productForPackage: productForPackage,
        storeSkus: storeSkus
      });
      cclegacy._RF.push({}, "245363hn+VDbrNhXGMkbqlx", "iap", undefined);

      // ─────────────────────────────────────────────────────────────
      // 인앱 결제(IAP) 상품 매핑 — 게임 상품 ↔ 스토어 SKU.
      //   실 결제 모듈(expo-in-app-purchases / react-native-iap / RevenueCat)이
      //   이 SKU로 상품을 조회·결제하고, 성공 콜백에서 shop.purchase(state, id)로
      //   보상을 지급한다. SHOP.package(실결제 상품)에서 자동 파생해 드리프트를 막는다.
      // ─────────────────────────────────────────────────────────────

      var IAP_PRODUCTS = exports('IAP_PRODUCTS', Object.fromEntries(SHOP["package"].map(function (p) {
        return [p.id, {
          id: p.id,
          label: p.label,
          price: p.krw,
          ios: "eldria." + p.id.toLowerCase(),
          // App Store product id
          android: p.id.toLowerCase(),
          // Google Play product id
          consumable: !p.once // 1회성(once)은 non-consumable
        }];
      })));

      function productForPackage(id) {
        return IAP_PRODUCTS[id] || null;
      }

      // 플랫폼별 등록해야 할 스토어 SKU 목록 (스토어 콘솔 상품 등록/조회용).
      function storeSkus(platform) {
        return Object.values(IAP_PRODUCTS).map(function (p) {
          return platform === 'ios' ? p.ios : p.android;
        });
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/idle.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './resolution.ts', './gameState.ts', './economy.ts', './balance.ts', './lootbox.ts', './difficulty.ts'], function (exports) {
  var _extends, cclegacy, resolve, getPartyUnits, earn, accountMods, openPrestigeBox, playStage;
  return {
    setters: [function (module) {
      _extends = module.extends;
    }, function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      resolve = module.resolve;
    }, function (module) {
      getPartyUnits = module.getPartyUnits;
    }, function (module) {
      earn = module.earn;
    }, function (module) {
      accountMods = module.accountMods;
    }, function (module) {
      openPrestigeBox = module.openPrestigeBox;
    }, function (module) {
      playStage = module.playStage;
    }],
    execute: function () {
      cclegacy._RF.push({}, "2b6bfRPIJ9HVb/mIE1lVfuO", "idle", undefined);

      // ─────────────────────────────────────────────────────────────
      // 장르 어댑터: 방치형 (자동/누적형)
      // 시간이 스스로 굴러간다. 현재 스테이지를 자동 반복 클리어하며
      // 초당 보상을 누적하고, 충분히 강하면 자동으로 다음 스테이지로 전진.
      // 오프라인(큰 dt) 누적과 환생(prestige)을 지원한다.
      //
      // 핵심: RPG와 "완전히 같은" resolve()를 쓰되, win 대신 duration을 쓴다.
      // ─────────────────────────────────────────────────────────────

      var OFFLINE_CAP_SEC = 8 * 3600; // 오프라인 보상 상한 8시간
      // 현재 스테이지를 이 시간 안에 클리어할 만큼 강하면 "여유 있음"으로 보고
      // 다음 스테이지로 전진한다. 벽(=이 값보다 오래 걸림)에 닿으면 거기서 파밍.
      var AUTO_ADVANCE_MARGIN = 2.5; // 초

      var idleGenre = exports('idleGenre', {
        id: 'idle',
        name: '방치형 (자동)',
        // dtSeconds 만큼 시간을 진행시키고 누적 보상을 반환.
        tick: function tick(state, dtSeconds) {
          var remaining = Math.min(dtSeconds, OFFLINE_CAP_SEC);
          var party = getPartyUnits(state);
          var mods = accountMods(state);
          var gained = {
            currency: 0,
            growth: 0
          };
          var clears = 0;

          // 난이도 벽 대응: 상위 난이도(험난↑)에서 현재 스테이지가 이길 수 없으면
          // 이길 수 있는 층까지 하강한다(난이도 전환 시 자동 재정착).
          // 일반 난이도는 기존 "벽에서 정지" 동작을 유지(하강 안 함).
          if (state.difficulty && state.difficulty !== 'normal') {
            var guard = 0;
            while (state.stage > 1 && guard++ < 500) {
              var r = resolve(party, playStage(state).challenge, mods, state.formation);
              if (r.win && r.duration !== Infinity) break;
              state.stage -= 1;
            }
          }

          // 시간 예산이 남는 동안 현재 스테이지를 반복
          while (remaining > 0) {
            var stageDef = playStage(state);
            var result = resolve(party, stageDef.challenge, mods, state.formation);
            if (!result.win || result.duration === Infinity) break; // 벽에 막힘

            // 다음 스테이지가 너무 쉬우면 전진 (성장에 따른 자동 진행)
            if (result.duration <= AUTO_ADVANCE_MARGIN) {
              state.stage += 1;
              state.maxStage = Math.max(state.maxStage, state.stage);
              state.peakStage = Math.max(state.peakStage || 1, state.maxStage);
              continue;
            }
            if (result.duration > remaining) break; // 한 판 돌릴 시간도 없음

            remaining -= result.duration;
            clears += 1;
            gained.currency += stageDef.rewards.currency;
            gained.growth += stageDef.rewards.growth;
          }

          // 방치 수입 배수: 환생 + 유물 (accountMods) 반영
          gained.currency = Math.round(gained.currency * mods.currencyMult);
          gained.growth = Math.round(gained.growth * mods.growthMult);
          earn(state.wallet, gained);
          state.lastTick = Date.now();
          return {
            clears: clears,
            gained: gained,
            stage: state.stage
          };
        },
        // 실제 경과 시간으로 오프라인 보상 정산
        collectOffline: function collectOffline(state, nowMs) {
          if (nowMs === void 0) {
            nowMs = Date.now();
          }
          if (!state.lastTick) {
            state.lastTick = nowMs;
            return {
              clears: 0,
              gained: {
                currency: 0,
                growth: 0
              },
              stage: state.stage,
              seconds: 0
            };
          }
          var dt = Math.max(0, (nowMs - state.lastTick) / 1000);
          return _extends({}, this.tick(state, dt), {
            seconds: Math.min(dt, OFFLINE_CAP_SEC)
          });
        },
        // QoL: 오프라인 보상 2배 — 광고 시청 등으로 정산된 보상만큼 한 번 더 지급.
        //   rew.gained(정산 결과)를 그대로 넘기면 순증 = 2배가 된다.
        applyOfflineBonus: function applyOfflineBonus(state, gained, factor) {
          if (factor === void 0) {
            factor = 1;
          }
          if (!gained) return {
            ok: false
          };
          var bonus = {
            currency: Math.round((gained.currency || 0) * factor),
            growth: Math.round((gained.growth || 0) * factor)
          };
          if (bonus.currency <= 0 && bonus.growth <= 0) return {
            ok: false
          };
          earn(state.wallet, bonus);
          return {
            ok: true,
            bonus: bonus
          };
        },
        // 환생: 이번 회차 진행을 리셋하고 영구 파워/수입 배수를 얻는다.
        // 정통 방치형 루프 — 벽에서 환생 → 배수로 더 깊이 재등반.
        // peakStage(역대 최고)는 유지하므로 "실제 진행도"는 사라지지 않는다.
        prestige: function prestige(state, rng) {
          if (rng === void 0) {
            rng = Math.random;
          }
          var gain = Math.floor(Math.sqrt(state.maxStage));
          if (gain < 1) return {
            prestigeGained: 0,
            totalPrestige: state.prestige
          };
          // 리셋 전 도달치로 전리품 상자 지급.
          var box = openPrestigeBox(state, state.maxStage, rng);
          state.prestige += gain;
          state.peakStage = Math.max(state.peakStage || 1, state.maxStage);
          state.stage = 1;
          state.maxStage = 1; // 이번 회차 리셋 → 재등반
          return {
            prestigeGained: gain,
            totalPrestige: state.prestige,
            box: box
          };
        }
      });
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/index.ts", ['cc', './fantasy.ts', './scifi.ts', './costumes.ts'], function (exports) {
  var cclegacy, fantasyConcept, scifiConcept, COSTUMES;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      fantasyConcept = module.fantasyConcept;
    }, function (module) {
      scifiConcept = module.scifiConcept;
    }, function (module) {
      COSTUMES = module.COSTUMES;
    }],
    execute: function () {
      exports({
        characterOf: characterOf,
        elementMeta: elementMeta,
        identity: identity,
        linesOf: linesOf,
        renderUnit: renderUnit,
        renderWallet: renderWallet,
        sigWeaponOf: sigWeaponOf
      });
      cclegacy._RF.push({}, "b7a4dKwlfBKaKfNViF86qZ0", "index", undefined);
      var CONCEPTS = exports('CONCEPTS', {
        fantasy: fantasyConcept,
        scifi: scifiConcept
      });

      // 컨셉 도감에서 characterId로 정체성을 찾는다.
      function characterOf(concept, id) {
        return (concept.roster || []).find(function (c) {
          return c.id === id;
        }) || null;
      }

      // 유닛의 표시 정체성: 캐릭터가 있으면 이름/이모지/칭호/성격, 없으면 원형 fallback.
      function identity(concept, unit) {
        var ch = unit.characterId && characterOf(concept, unit.characterId);
        // 외형: 코스튬 스킨(unit.skin, core/costumes) 장착 시 이모지 교체.
        var skin = unit.skin && COSTUMES[unit.skin];
        if (ch) {
          return {
            name: ch.name,
            emoji: skin ? skin.emoji : ch.emoji,
            title: ch.title,
            personality: ch.personality,
            element: ch.element
          };
        }
        var a = concept.archetypes[unit.archetype];
        return {
          name: a.name,
          emoji: skin ? skin.emoji : a.emoji,
          title: null,
          personality: null,
          element: unit.element || null
        };
      }

      // 전용무기 표시명/이모지. 컨셉이 weapons[characterId]로 지정하면 그걸 쓰고,
      // 없으면 원형에 맞춰 파생(캐릭터명 + 무기 종류). Core 수치와는 무관한 렌더용.
      var ARCH_WEAPON = {
        STRIKER: {
          emoji: '⚔️',
          kind: '검'
        },
        VANGUARD: {
          emoji: '🛡️',
          kind: '중갑'
        },
        SUPPORT: {
          emoji: '🔮',
          kind: '법구'
        },
        ROGUE: {
          emoji: '🗡️',
          kind: '단검'
        },
        ARCHER: {
          emoji: '🏹',
          kind: '활'
        },
        MAGE: {
          emoji: '📖',
          kind: '마도서'
        }
      };
      function sigWeaponOf(concept, unit) {
        var _concept$archetypes$u;
        var w = concept.weapons && concept.weapons[unit.characterId];
        if (w) return {
          name: w.name,
          emoji: w.emoji
        };
        var a = ARCH_WEAPON[unit.archetype] || ARCH_WEAPON.STRIKER;
        var ch = unit.characterId && characterOf(concept, unit.characterId);
        var base = ch ? ch.name : ((_concept$archetypes$u = concept.archetypes[unit.archetype]) == null ? void 0 : _concept$archetypes$u.name) || '영웅';
        return {
          name: base + "\uC758 " + a.kind,
          emoji: a.emoji
        };
      }

      // 속성 ID → 표시명/이모지 (컨셉 매핑). 없으면 ID 그대로.
      function elementMeta(concept, id) {
        if (!id) return null;
        return concept.elements && concept.elements[id] || {
          name: id,
          emoji: ''
        };
      }

      // 유닛의 대사 세트 (캐릭터가 있을 때만).
      function linesOf(concept, unit) {
        var ch = unit.characterId && characterOf(concept, unit.characterId);
        return ch && ch.lines || null;
      }

      // 컨셉을 적용해 유닛을 사람이 읽을 수 있게 렌더 (숫자는 그대로).
      function renderUnit(concept, unit, stats) {
        var id = identity(concept, unit);
        return id.emoji + " " + id.name + " Lv." + unit.level + "/R" + unit.rank + (stats ? " (HP " + stats.hp + " / ATK " + stats.atk + ")" : '');
      }

      // 컨셉을 적용해 지갑을 렌더.
      function renderWallet(concept, wallet) {
        return Object.entries(wallet).map(function (_ref) {
          var k = _ref[0],
            v = _ref[1];
          var r = concept.resources[k];
          return r ? r.emoji + " " + r.name + " " + v : k + " " + v;
        }).join('  ·  ');
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/intimacy.ts", ['cc', './economy.ts'], function (exports) {
  var cclegacy, spend;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      spend = module.spend;
    }],
    execute: function () {
      exports({
        giftCost: giftCost,
        giveGift: giveGift,
        intimacyBonus: intimacyBonus,
        intimacyLevel: intimacyLevel,
        intimacyProgress: intimacyProgress
      });
      cclegacy._RF.push({}, "53d22nJzaZPMLjfQCG97zYk", "intimacy", undefined);

      // ─────────────────────────────────────────────────────────────
      // 친밀도 — 유닛별 호감도. 선물로 올리며, 레벨업 시 소량 스탯 보너스 +
      // (Concept의) 대사/감정을 해금한다. "매일 확인하고 싶은 애착" 루프.
      // Core는 수치만, 대사는 Concept가 소유.
      // ─────────────────────────────────────────────────────────────

      var INTIMACY_MAX = exports('INTIMACY_MAX', 10);
      var POINTS_PER_LEVEL = 100;
      var GIFT_POINTS = exports('GIFT_POINTS', 40);
      function intimacyLevel(unit) {
        return Math.min(INTIMACY_MAX, Math.floor((unit.intimacy || 0) / POINTS_PER_LEVEL));
      }
      function intimacyProgress(unit) {
        var p = (unit.intimacy || 0) % POINTS_PER_LEVEL;
        return {
          have: p,
          need: POINTS_PER_LEVEL,
          ratio: p / POINTS_PER_LEVEL
        };
      }
      // 친밀도 레벨당 전 스탯 +2% (해당 유닛)
      function intimacyBonus(unit) {
        return intimacyLevel(unit) * 0.02;
      }
      function giftCost(unit) {
        return {
          currency: Math.round(200 * Math.pow(1.3, intimacyLevel(unit)))
        };
      }

      // 선물하기: currency 소모 → 친밀도 상승.
      function giveGift(state, uid) {
        var u = state.units.find(function (x) {
          return x.uid === uid;
        });
        if (!u) return {
          ok: false,
          reason: '유닛 없음'
        };
        if (intimacyLevel(u) >= INTIMACY_MAX) return {
          ok: false,
          reason: '최대 친밀도'
        };
        var cost = giftCost(u);
        if (!spend(state.wallet, cost)) return {
          ok: false,
          reason: '재화 부족',
          cost: cost
        };
        var before = intimacyLevel(u);
        u.intimacy = (u.intimacy || 0) + GIFT_POINTS;
        var after = intimacyLevel(u);
        return {
          ok: true,
          level: after,
          leveledUp: after > before,
          cost: cost
        };
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/loadout.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './skills.ts', './gear.ts', './runes.ts', './character.ts', './stats.ts'], function (exports) {
  var _createForOfIteratorHelperLoose, cclegacy, skillSlots, equippableSkills, equipGear, GEAR_CATALOG, gearCraftCost, craftGear, GEAR_SLOTS, RUNE_SLOTS, runeMainValue, equipRune, equipSkill, computePower;
  return {
    setters: [function (module) {
      _createForOfIteratorHelperLoose = module.createForOfIteratorHelperLoose;
    }, function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      skillSlots = module.skillSlots;
      equippableSkills = module.equippableSkills;
    }, function (module) {
      equipGear = module.equipGear;
      GEAR_CATALOG = module.GEAR_CATALOG;
      gearCraftCost = module.gearCraftCost;
      craftGear = module.craftGear;
      GEAR_SLOTS = module.GEAR_SLOTS;
    }, function (module) {
      RUNE_SLOTS = module.RUNE_SLOTS;
      runeMainValue = module.runeMainValue;
      equipRune = module.equipRune;
    }, function (module) {
      equipSkill = module.equipSkill;
    }, function (module) {
      computePower = module.computePower;
    }],
    execute: function () {
      exports('optimizeLoadout', optimizeLoadout);
      cclegacy._RF.push({}, "e37c0yC2BFOe5MtN+PEZDwM", "loadout", undefined);

      // ─────────────────────────────────────────────────────────────
      // 추천 빌드 — 보유 자원 중 최적 조합을 한 번에 장착하는 QoL.
      //   · 비파괴적: 빈 스킬 슬롯만 채우고(기존 선택·레벨 보존),
      //     장비·룬은 "보유분 중 더 나은 것"으로만 교체(밀려난 것은 회수).
      //   · 원형별 가중치로 딜러/탱커/서포터에 맞는 스킬을 고른다.
      // ─────────────────────────────────────────────────────────────

      var ROLE_W = {
        VANGUARD: {
          atk: 0.7,
          hp: 1.1,
          def: 1.1,
          spd: 0.6,
          effect: 0.8,
          team: 1.0
        },
        STRIKER: {
          atk: 1.2,
          hp: 0.4,
          def: 0.4,
          spd: 0.9,
          effect: 1.0,
          team: 1.0
        },
        SUPPORT: {
          atk: 0.6,
          hp: 0.9,
          def: 0.8,
          spd: 0.7,
          effect: 0.9,
          team: 1.4
        },
        ROGUE: {
          atk: 1.1,
          hp: 0.4,
          def: 0.3,
          spd: 1.2,
          effect: 1.1,
          team: 1.0
        },
        ARCHER: {
          atk: 1.0,
          hp: 0.5,
          def: 0.5,
          spd: 0.9,
          effect: 1.0,
          team: 1.0
        },
        MAGE: {
          atk: 1.3,
          hp: 0.3,
          def: 0.3,
          spd: 0.7,
          effect: 1.0,
          team: 1.0
        }
      };
      function weights(unit) {
        return ROLE_W[unit.archetype] || ROLE_W.STRIKER;
      }
      function effectSum(e) {
        if (e === void 0) {
          e = {};
        }
        return (e.critChance || 0) + (e.critDamage || 0) + (e.lifesteal || 0) + (e.defPierce || 0) + (e.dmgReduce || 0);
      }
      function skillScore(skill, w) {
        var p = skill.statPct || {};
        var tb = skill.teamBuff || {};
        var team = (tb.atk || 0) + (tb.def || 0) + (tb.critChance || 0);
        return (p.atk || 0) * w.atk + (p.hp || 0) * w.hp + (p.def || 0) * w.def + (p.spd || 0) * w.spd + effectSum(skill.effect) * w.effect + team * w.team;
      }
      // 장비 후보를 슬롯에 임시 장착했을 때의 실제 전투력(computePower) — 휴리스틱이
      // 아니라 진짜 파워로 비교하므로 "더 강한 장비"를 항상 정확히 고른다.
      function powerWithGear(unit, slot, item) {
        var prev = unit.gear[slot];
        unit.gear[slot] = item || null;
        var p = computePower(unit);
        unit.gear[slot] = prev; // 원복 (실제 장착은 equipGear가 담당)
        return p;
      }

      // 한 유닛의 스킬·장비·룬을 추천값으로 장착. { ok, changed:{skills,gear,runes} }.
      //   scope: 'all'(기본) | 'skill' | 'gear'(장비+룬) — 카드별 부분 최적화 지원.
      function optimizeLoadout(state, unitUid, scope) {
        if (scope === void 0) {
          scope = 'all';
        }
        var unit = state.units.find(function (u) {
          return u.uid === unitUid;
        });
        if (!unit) return {
          ok: false,
          reason: '유닛 없음'
        };
        var w = weights(unit);
        var changed = {
          skills: 0,
          gear: 0,
          runes: 0
        };
        var doSkill = scope === 'all' || scope === 'skill';
        var doGear = scope === 'all' || scope === 'gear';

        // 1) 스킬 — 빈 슬롯만 최고 점수의 미장착 스킬로 채운다(기존 슬롯·레벨 보존).
        if (doSkill) {
          var slots = skillSlots(unit);
          var used = new Set((unit.skills || []).filter(Boolean).map(function (s) {
            return s.id;
          }));
          var ranked = equippableSkills().filter(function (s) {
            return !used.has(s.id);
          }).sort(function (a, b) {
            return skillScore(b, w) - skillScore(a, w);
          });
          var ri = 0;
          for (var i = 0; i < slots; i++) {
            if (unit.skills[i]) continue;
            var s = ranked[ri++];
            if (!s) break;
            if (equipSkill(state, unitUid, i, s.id).ok) changed.skills++;
          }
        }
        if (!doGear) return {
          ok: true,
          changed: changed
        };

        // 2) 장비 — 슬롯별로 실제 전투력 기준 최적 선택:
        //    (a) 인벤토리 후보 중 파워를 가장 높이는 것이 장착품보다 강하면 교체,
        //    (b) 아니면 감당 가능한 상위 설계도의 신규 아이템이 더 강하면 제작·장착.
        //    → 빈 슬롯 채움 + 낀 슬롯 업그레이드. 진짜 파워로 비교(휴리스틱 아님).
        var _loop = function _loop() {
          var slot = _step.value;
          var equipped = unit.gear[slot];
          var eqPow = powerWithGear(unit, slot, equipped); // 현재(또는 빈 슬롯) 파워
          // (a) 인벤토리 최고 파워 후보
          var cands = state.inventory.filter(function (g) {
            return g.slot === slot;
          });
          var best = null,
            bestPow = eqPow;
          for (var _iterator2 = _createForOfIteratorHelperLoose(cands), _step2; !(_step2 = _iterator2()).done;) {
            var cand = _step2.value;
            var pow = powerWithGear(unit, slot, cand);
            if (pow > bestPow) {
              bestPow = pow;
              best = cand;
            }
          }
          if (best) {
            if (equipGear(state, unitUid, best.uid).ok) {
              changed.gear++;
              return 1; // continue
            }
          }
          // (b) 제작 업그레이드: 감당 가능한 상위 티어 신규 아이템이 더 강하면 제작.
          var eqCost = equipped ? GEAR_CATALOG[equipped.blueprint].craftCost || 150 : 0;
          var affordable = Object.values(GEAR_CATALOG).filter(function (b) {
            return b.slot === slot && (state.wallet.currency || 0) >= gearCraftCost(b.id).currency;
          });
          if (affordable.length) {
            var bp = affordable.reduce(function (a, b) {
              return (b.craftCost || 150) > (a.craftCost || 150) ? b : a;
            });
            var mock = {
              blueprint: bp.id,
              level: 1,
              rarity: 'R',
              subs: []
            };
            // 상위 티어이고 신규 아이템 파워가 장착품보다 클 때만(다운그레이드·낭비 방지).
            if ((bp.craftCost || 150) > eqCost && powerWithGear(unit, slot, mock) > eqPow) {
              var c = craftGear(state, bp.id);
              if (c.ok && equipGear(state, unitUid, c.item.uid).ok) changed.gear++;
            }
          }
        };
        for (var _iterator = _createForOfIteratorHelperLoose(GEAR_SLOTS), _step; !(_step = _iterator()).done;) {
          if (_loop()) continue;
        }

        // 3) 룬 — 슬롯별 가방 최고 메인값이 장착품보다 크면 교체.
        for (var _i = 0; _i < RUNE_SLOTS; _i++) {
          var bag = state.runeBag || [];
          if (!bag.length) continue;
          var best = bag.reduce(function (a, b) {
            return runeMainValue(b) > runeMainValue(a) ? b : a;
          });
          var equipped = (unit.runes || [])[_i];
          if (!equipped || runeMainValue(best) > runeMainValue(equipped)) {
            if (equipRune(state, unitUid, _i, best.uid).ok) changed.runes++;
          }
        }
        return {
          ok: true,
          changed: changed
        };
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/lootbox.ts", ['cc', './economy.ts', './gear.ts', './runes.ts'], function (exports) {
  var cclegacy, earn, dropGear, dropRune;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      earn = module.earn;
    }, function (module) {
      dropGear = module.dropGear;
    }, function (module) {
      dropRune = module.dropRune;
    }],
    execute: function () {
      exports('openPrestigeBox', openPrestigeBox);
      cclegacy._RF.push({}, "9d9e6x/61RCCKUYLp/hyiSc", "lootbox", undefined);

      // ─────────────────────────────────────────────────────────────
      // 전리품 상자 — 환생 보상. 이번 회차 도달(maxStage) 비례로 굴린다.
      //   · 드롭 수 = 2 + floor(peak/40), 상위등급 luck = peak/200.
      //   · 장비/룬(실 아이템) + 다이아/소환권을 가중 롤 → 환생에 "뽑는 맛".
      // 반환: { rolls, gear, rune, gem, summon } (연출/요약용).
      // ─────────────────────────────────────────────────────────────
      function openPrestigeBox(state, peakStage, rng) {
        if (rng === void 0) {
          rng = Math.random;
        }
        var peak = Math.max(1, peakStage || 1);
        var luck = Math.min(1, peak / 200);
        var rolls = 2 + Math.floor(peak / 40);
        var out = {
          rolls: rolls,
          gear: 0,
          rune: 0,
          gem: 0,
          summon: 0
        };
        for (var i = 0; i < rolls; i++) {
          var r = rng();
          if (r < 0.35) {
            dropGear(state, rng, luck);
            out.gear++;
          } else if (r < 0.60) {
            dropRune(state, rng, luck);
            out.rune++;
          } else if (r < 0.85) {
            var g = 5 + Math.floor(peak / 10);
            earn(state.wallet, {
              gem: g
            });
            out.gem += g;
          } else {
            var s = 10 + Math.floor(peak / 8);
            earn(state.wallet, {
              summon: s
            });
            out.summon += s;
          }
        }
        return out;
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/mailbox.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './economy.ts'], function (exports) {
  var _createForOfIteratorHelperLoose, cclegacy, earn;
  return {
    setters: [function (module) {
      _createForOfIteratorHelperLoose = module.createForOfIteratorHelperLoose;
    }, function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      earn = module.earn;
    }],
    execute: function () {
      exports({
        addMail: addMail,
        claimAllMail: claimAllMail,
        claimMail: claimMail,
        clearClaimedMail: clearClaimedMail,
        ensureMailSeq: ensureMailSeq,
        mailList: mailList,
        unreadMailCount: unreadMailCount
      });
      cclegacy._RF.push({}, "03cd2/VNy1KdJIbD7T+IPHg", "mailbox", undefined);

      // ─────────────────────────────────────────────────────────────
      // 우편함 — 지연 보상 수령함(순위 정산·이벤트·운영 보상).
      //   서버 연동 전에는 로컬에서 정산 보상을 여기에 넣고 수령한다.
      //   서버 연동 시 서버가 우편을 push하고 클라는 동일 UI로 수령.
      // mail: { id, title, reward:{gem,currency,...}, ts, claimed }
      // ─────────────────────────────────────────────────────────────

      var _mseq = 0;
      function ensureMailSeq(n) {
        if (n > _mseq) _mseq = n;
      }
      function ensure(state) {
        state.mail = state.mail || [];
        return state.mail;
      }
      function addMail(state, _temp) {
        var _ref = _temp === void 0 ? {} : _temp,
          title = _ref.title,
          _ref$reward = _ref.reward,
          reward = _ref$reward === void 0 ? {} : _ref$reward,
          _ref$ts = _ref.ts,
          ts = _ref$ts === void 0 ? Date.now() : _ref$ts;
        var box = ensure(state);
        var mail = {
          id: "m" + ++_mseq,
          title: title || '보상',
          reward: reward,
          ts: ts,
          claimed: false
        };
        box.push(mail);
        // 오래된 수령 완료 우편 정리(최근 100통 유지).
        if (box.length > 100) state.mail = box.slice(-100);
        return mail;
      }
      function mailList(state) {
        return (state.mail || []).slice().sort(function (a, b) {
          return b.ts - a.ts;
        });
      }
      function unreadMailCount(state) {
        return (state.mail || []).filter(function (m) {
          return !m.claimed;
        }).length;
      }
      function claimMail(state, id) {
        var m = (state.mail || []).find(function (x) {
          return x.id === id;
        });
        if (!m) return {
          ok: false,
          reason: '없는 우편'
        };
        if (m.claimed) return {
          ok: false,
          reason: '이미 수령'
        };
        earn(state.wallet, m.reward || {});
        m.claimed = true;
        return {
          ok: true,
          reward: m.reward
        };
      }
      function claimAllMail(state) {
        var got = [];
        for (var _iterator = _createForOfIteratorHelperLoose(state.mail || []), _step; !(_step = _iterator()).done;) {
          var m = _step.value;
          if (!m.claimed) {
            earn(state.wallet, m.reward || {});
            m.claimed = true;
            got.push(m.id);
          }
        }
        return {
          ok: got.length > 0,
          claimed: got.length
        };
      }

      // QoL: 수령 완료(읽은) 우편을 우편함에서 제거. 미수령 우편은 남긴다.
      function clearClaimedMail(state) {
        var box = state.mail || [];
        var kept = box.filter(function (m) {
          return !m.claimed;
        });
        var removed = box.length - kept.length;
        state.mail = kept;
        return {
          ok: removed > 0,
          removed: removed
        };
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/main", ['./BattleDemo.ts', './fantasy.ts', './index.ts', './scifi.ts', './admin.ts', './archetypes.ts', './arena.ts', './balance.ts', './buildcopy.ts', './campaign.ts', './character.ts', './compshop.ts', './console.ts', './cosmetics.ts', './costumes.ts', './daily.ts', './difficulty.ts', './dismantle.ts', './economy.ts', './elements.ts', './emblems.ts', './enhance.ts', './events.ts', './features.ts', './formation.ts', './gacha.ts', './gameState.ts', './gear.ts', './gearcarry.ts', './gearsalvage.ts', './guardians.ts', './guild.ts', './iap.ts', './intimacy.ts', './loadout.ts', './lootbox.ts', './mailbox.ts', './materials.ts', './meta.ts', './modifiers.ts', './nudges.ts', './partyPresets.ts', './pets.ts', './progression.ts', './relics.ts', './rentals.ts', './resolution.ts', './rng.ts', './roles.ts', './run.ts', './runBoons.ts', './runes.ts', './save.ts', './season.ts', './seed.ts', './shop.ts', './sigweapon.ts', './skills.ts', './spriteAnim.ts', './starGrade.ts', './stats.ts', './summon.ts', './summonMastery.ts', './synergy.ts', './tower.ts', './tutorial.ts', './units.ts', './unlocks.ts', './village.ts', './idle.ts', './rpg.ts'], function () {
  return {
    setters: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
    execute: function () {}
  };
});

System.register("chunks:///_virtual/materials.ts", ['cc'], function (exports) {
  var cclegacy;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }],
    execute: function () {
      exports({
        addMaterial: addMaterial,
        ensureMaterials: ensureMaterials,
        materialCount: materialCount,
        spendMaterial: spendMaterial
      });
      cclegacy._RF.push({}, "6d2d92CChhFLaqIlHYp1cqX", "materials", undefined);
      // ─────────────────────────────────────────────────────────────
      // 재료(Materials) — 던전에서 얻어 특정 성장에 쓰는 소모품.
      //   · elemEssence(속성정수): 장비 속성 옵션 부여 — 속성 던전.
      //   · petShard(펫조각): 등급별, 아무 펫에나 쓰는 조각 — 펫 던전.
      // 지갑(wallet)과 분리된 별도 저장소(state.materials).
      // (돌파석은 폐지 — 돌파는 소환석/동일 영웅 소모로 전환.)
      // ─────────────────────────────────────────────────────────────

      var MATERIAL_META = exports('MATERIAL_META', {
        elemEssence: {
          label: '속성정수',
          emoji: '🔷'
        }
      });
      var SHARD_META = exports('SHARD_META', {
        emoji: '🧩',
        label: '펫조각'
      });
      function ensureMaterials(state) {
        state.materials = state.materials || {};
        var m = state.materials;
        if (typeof m.elemEssence !== 'number') m.elemEssence = 0;
        m.petShard = m.petShard || {};
        for (var _i = 0, _arr = ['R', 'SR', 'SSR', 'UR']; _i < _arr.length; _i++) {
          var g = _arr[_i];
          if (typeof m.petShard[g] !== 'number') m.petShard[g] = 0;
        }
        return m;
      }

      // 재료 지급. kind='petShard'면 sub(등급)에 누적.
      function addMaterial(state, kind, amount, sub) {
        if (sub === void 0) {
          sub = null;
        }
        var m = ensureMaterials(state);
        if (kind === 'petShard') m.petShard[sub] = (m.petShard[sub] || 0) + amount;else m[kind] = (m[kind] || 0) + amount;
      }
      function materialCount(state, kind, sub) {
        if (sub === void 0) {
          sub = null;
        }
        var m = ensureMaterials(state);
        return kind === 'petShard' ? m.petShard[sub] || 0 : m[kind] || 0;
      }

      // 재료 소모(부족하면 false).
      function spendMaterial(state, kind, amount, sub) {
        if (sub === void 0) {
          sub = null;
        }
        var have = materialCount(state, kind, sub);
        if (have < amount) return false;
        var m = ensureMaterials(state);
        if (kind === 'petShard') m.petShard[sub] -= amount;else m[kind] -= amount;
        return true;
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/meta.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './economy.ts', './progression.ts'], function (exports) {
  var _createForOfIteratorHelperLoose, _extends, cclegacy, earn, getStage;
  return {
    setters: [function (module) {
      _createForOfIteratorHelperLoose = module.createForOfIteratorHelperLoose;
      _extends = module.extends;
    }, function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      earn = module.earn;
    }, function (module) {
      getStage = module.getStage;
    }],
    execute: function () {
      exports({
        achievementList: achievementList,
        buySeasonPremium: buySeasonPremium,
        claimAchievement: claimAchievement,
        claimCollection: claimCollection,
        claimSeason: claimSeason,
        collectionList: collectionList,
        metaGrantPreview: metaGrantPreview,
        ownedCharacterIds: ownedCharacterIds,
        seasonProgress: seasonProgress,
        seasonReward: seasonReward,
        seasonTier: seasonTier,
        seasonTierList: seasonTierList,
        seasonXp: seasonXp
      });
      cclegacy._RF.push({}, "aef5duPrK5Etoq89AuRdNAQ", "meta", undefined);

      // ─────────────────────────────────────────────────────────────
      // 리텐션 메타 — 도감·업적·시즌패스. 대부분 "진행 상태의 투영"이라
      // 새 상태는 청구(claim) 기록만 둔다: state.meta = { achv, coll, season }.
      //   · 도감    : 보유 영웅(characterId) 수 마일스톤
      //   · 업적    : 스테이지·환생·수집·유물 등 목표 달성 보상
      //   · 시즌패스 : 진행도 기반 XP → 티어, 무료/프리미엄 보상
      // 보상의 *Stage 키는 진행도(peakStage) 비례 스케일(상점 규약과 동일).
      // ─────────────────────────────────────────────────────────────

      function ownedCharacterIds(state) {
        var set = new Set();
        for (var _iterator = _createForOfIteratorHelperLoose(state.units || []), _step; !(_step = _iterator()).done;) {
          var u = _step.value;
          if (u.characterId) set.add(u.characterId);
        }
        return set;
      }
      function relicSum(state) {
        return Object.values(state.relics || {}).reduce(function (a, b) {
          return a + b;
        }, 0);
      }
      function scaleReward(state, reward) {
        var st = getStage(state.peakStage).rewards;
        var out = {};
        for (var _i = 0, _arr = Object.entries(reward); _i < _arr.length; _i++) {
          var _arr$_i = _arr[_i],
            k = _arr$_i[0],
            v = _arr$_i[1];
          if (k === 'currencyStage') out.currency = (out.currency || 0) + Math.round(st.currency * v);else if (k === 'growthStage') out.growth = (out.growth || 0) + Math.round(st.growth * v);else out[k] = (out[k] || 0) + v;
        }
        return out;
      }

      // ── 업적 ───────────────────────────────────────────────────────
      var ACHIEVEMENTS = exports('ACHIEVEMENTS', [{
        id: 'stage25',
        label: '첫 발자국',
        desc: '스테이지 25 도달',
        metric: function metric(s) {
          return s.peakStage || 1;
        },
        goal: 25,
        reward: {
          gem: 50
        }
      }, {
        id: 'stage60',
        label: '모험가',
        desc: '스테이지 60 도달',
        metric: function metric(s) {
          return s.peakStage || 1;
        },
        goal: 60,
        reward: {
          gem: 100
        }
      }, {
        id: 'prestige5',
        label: '환생자',
        desc: '환생 5회 달성',
        metric: function metric(s) {
          return s.prestige || 0;
        },
        goal: 5,
        reward: {
          summon: 50
        }
      }, {
        id: 'collect3',
        label: '수집의 시작',
        desc: '영웅 3종 수집',
        metric: function metric(s) {
          return ownedCharacterIds(s).size;
        },
        goal: 3,
        reward: {
          gem: 40
        }
      }, {
        id: 'collect6',
        label: '수집가',
        desc: '영웅 6종 수집',
        metric: function metric(s) {
          return ownedCharacterIds(s).size;
        },
        goal: 6,
        reward: {
          gem: 120
        }
      }, {
        id: 'relic20',
        label: '유물학자',
        desc: '유물 합계 Lv.20',
        metric: function metric(s) {
          return relicSum(s);
        },
        goal: 20,
        reward: {
          gem: 80
        }
      }]);
      function achievementList(state) {
        return ACHIEVEMENTS.map(function (a) {
          var cur = a.metric(state);
          return _extends({}, a, {
            cur: cur,
            done: cur >= a.goal,
            claimed: !!state.meta.achv[a.id]
          });
        });
      }
      function claimAchievement(state, id) {
        var a = ACHIEVEMENTS.find(function (x) {
          return x.id === id;
        });
        if (!a) return {
          ok: false,
          reason: '없는 업적'
        };
        if (a.metric(state) < a.goal) return {
          ok: false,
          reason: '미달성'
        };
        if (state.meta.achv[id]) return {
          ok: false,
          reason: '수령 완료'
        };
        earn(state.wallet, a.reward);
        state.meta.achv[id] = true;
        return {
          ok: true,
          reward: a.reward
        };
      }

      // ── 도감 (수집 마일스톤) ───────────────────────────────────────
      var COLLECTION = exports('COLLECTION', [{
        id: 'c1',
        need: 1,
        reward: {
          gem: 20
        }
      }, {
        id: 'c3',
        need: 3,
        reward: {
          summon: 20
        }
      }, {
        id: 'c5',
        need: 5,
        reward: {
          gem: 60
        }
      }, {
        id: 'c8',
        need: 8,
        reward: {
          gem: 150
        }
      }, {
        id: 'c12',
        need: 12,
        reward: {
          gem: 250,
          summon: 30
        }
      }, {
        id: 'c14',
        need: 14,
        reward: {
          gem: 400,
          summon: 50
        }
      }]);
      function collectionList(state) {
        var owned = ownedCharacterIds(state).size;
        return COLLECTION.map(function (c) {
          return _extends({}, c, {
            owned: owned,
            done: owned >= c.need,
            claimed: !!state.meta.coll[c.id]
          });
        });
      }
      function claimCollection(state, id) {
        var c = COLLECTION.find(function (x) {
          return x.id === id;
        });
        if (!c) return {
          ok: false,
          reason: '없는 항목'
        };
        if (ownedCharacterIds(state).size < c.need) return {
          ok: false,
          reason: '미달성'
        };
        if (state.meta.coll[id]) return {
          ok: false,
          reason: '수령 완료'
        };
        earn(state.wallet, c.reward);
        state.meta.coll[id] = true;
        return {
          ok: true,
          reward: c.reward
        };
      }

      // ── 시즌패스 (진행도 XP → 티어) ────────────────────────────────
      var SEASON_XP_PER_TIER = exports('SEASON_XP_PER_TIER', 120);
      var SEASON_MAX_TIER = exports('SEASON_MAX_TIER', 15);
      function seasonXp(state) {
        return (state.peakStage || 1) * 10 + (state.prestige || 0) * 20 + ownedCharacterIds(state).size * 15 + relicSum(state) * 3;
      }
      function seasonTier(state) {
        return Math.min(SEASON_MAX_TIER, Math.floor(seasonXp(state) / SEASON_XP_PER_TIER));
      }
      function seasonProgress(state) {
        var xp = seasonXp(state);
        var tier = seasonTier(state);
        var into = xp - tier * SEASON_XP_PER_TIER;
        return {
          xp: xp,
          tier: tier,
          into: Math.min(into, SEASON_XP_PER_TIER),
          per: SEASON_XP_PER_TIER,
          premium: !!state.meta.season.premium
        };
      }
      // 티어별 보상: 무료(누구나) / 프리미엄(패스 구매 시).
      function seasonReward(tier, track) {
        if (track === 'free') return tier % 5 === 0 ? {
          summon: 20
        } : {
          currencyStage: 40
        };
        return tier % 5 === 0 ? {
          gem: 40
        } : {
          gem: 15
        };
      }
      function seasonTierList(state) {
        var cur = seasonTier(state);
        var out = [];
        for (var t = 1; t <= SEASON_MAX_TIER; t++) {
          out.push({
            tier: t,
            reached: cur >= t,
            free: {
              reward: seasonReward(t, 'free'),
              claimed: !!state.meta.season.claimed["f" + t]
            },
            premium: {
              reward: seasonReward(t, 'premium'),
              claimed: !!state.meta.season.claimed["p" + t]
            }
          });
        }
        return out;
      }
      function buySeasonPremium(state) {
        if (state.meta.season.premium) return {
          ok: false,
          reason: '이미 보유'
        };
        state.meta.season.premium = true; // 모의 결제(골격)
        return {
          ok: true
        };
      }
      function claimSeason(state, tier, track) {
        if (seasonTier(state) < tier) return {
          ok: false,
          reason: '티어 미달'
        };
        if (track === 'premium' && !state.meta.season.premium) return {
          ok: false,
          reason: '프리미엄 패스 필요'
        };
        var key = (track === 'free' ? 'f' : 'p') + tier;
        if (state.meta.season.claimed[key]) return {
          ok: false,
          reason: '수령 완료'
        };
        var reward = scaleReward(state, seasonReward(tier, track));
        earn(state.wallet, reward);
        state.meta.season.claimed[key] = true;
        return {
          ok: true,
          reward: reward
        };
      }

      // 도감/업적 보상 표시용 스케일 프리뷰
      function metaGrantPreview(state, reward) {
        return scaleReward(state, reward);
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/modifiers.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './archetypes.ts', './skills.ts', './enhance.ts', './gear.ts', './intimacy.ts', './sigweapon.ts', './runes.ts', './seed.ts'], function (exports) {
  var _createForOfIteratorHelperLoose, cclegacy, getArchetype, getSkill, skillPower, ENHANCE_NODES, gearContribution, gearSetBonus, GEAR_SLOTS, intimacyBonus, sigWeaponBoost, sigWeaponContribution, runeMainContribution, runeSetContribution, seedStatPct;
  return {
    setters: [function (module) {
      _createForOfIteratorHelperLoose = module.createForOfIteratorHelperLoose;
    }, function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      getArchetype = module.getArchetype;
    }, function (module) {
      getSkill = module.getSkill;
      skillPower = module.skillPower;
    }, function (module) {
      ENHANCE_NODES = module.ENHANCE_NODES;
    }, function (module) {
      gearContribution = module.gearContribution;
      gearSetBonus = module.gearSetBonus;
      GEAR_SLOTS = module.GEAR_SLOTS;
    }, function (module) {
      intimacyBonus = module.intimacyBonus;
    }, function (module) {
      sigWeaponBoost = module.sigWeaponBoost;
      sigWeaponContribution = module.sigWeaponContribution;
    }, function (module) {
      runeMainContribution = module.runeMainContribution;
      runeSetContribution = module.runeSetContribution;
    }, function (module) {
      seedStatPct = module.seedStatPct;
    }],
    execute: function () {
      exports('collectUnitModifiers', collectUnitModifiers);
      cclegacy._RF.push({}, "0cd41HhCKZGv6QUtLVq5ZDM", "modifiers", undefined);

      // ─────────────────────────────────────────────────────────────
      // 모디파이어 파이프라인 — 한 유닛의 "모든 성장 요소"를 하나로 합산.
      // 소스: 원형(archetype) · 장착 스킬 · 강화(각인)
      // 이 합산 결과를 stats(스탯 계산)와 resolution(판정)이 함께 쓴다.
      //
      // 반환 형태:
      //   statPct   : { atk, hp, def, spd }  자기 스탯 % 가산
      //   effect    : { critChance, critDamage, lifesteal, defPierce }
      //   teamBuff  : { atk }                팀 전체 버프
      // ─────────────────────────────────────────────────────────────

      function emptyMods() {
        return {
          statPct: {
            atk: 0,
            hp: 0,
            def: 0,
            spd: 0
          },
          statFlat: {
            atk: 0,
            hp: 0,
            def: 0,
            spd: 0
          },
          effect: {
            critChance: 0,
            critDamage: 0,
            lifesteal: 0,
            defPierce: 0,
            dmgReduce: 0,
            evasion: 0,
            accuracy: 0,
            trueDamage: 0,
            absDef: 0
          },
          // 팀버프 3종: atk(공격)·def(피해경감)·critChance(치명) — 지원형 정체성 분화.
          teamBuff: {
            atk: 0,
            def: 0,
            critChance: 0
          }
        };
      }

      // 팀버프 소스(atk/def/critChance)를 배수 반영해 합산.
      function addTeamBuff(mods, tb, scale) {
        if (scale === void 0) {
          scale = 1;
        }
        if (!tb) return;
        for (var _i = 0, _Object$keys = Object.keys(mods.teamBuff); _i < _Object$keys.length; _i++) {
          var k = _Object$keys[_i];
          if (tb[k]) mods.teamBuff[k] += tb[k] * scale;
        }
      }
      function addStatPct(mods, src, scale) {
        if (scale === void 0) {
          scale = 1;
        }
        if (!src) return;
        for (var _i2 = 0, _Object$keys2 = Object.keys(mods.statPct); _i2 < _Object$keys2.length; _i2++) {
          var k = _Object$keys2[_i2];
          if (src[k]) mods.statPct[k] += src[k] * scale;
        }
      }
      function addStatFlat(mods, src) {
        if (!src) return;
        for (var _i3 = 0, _Object$keys3 = Object.keys(mods.statFlat); _i3 < _Object$keys3.length; _i3++) {
          var k = _Object$keys3[_i3];
          if (src[k]) mods.statFlat[k] += src[k];
        }
      }
      function addEffect(mods, src, scale) {
        if (scale === void 0) {
          scale = 1;
        }
        if (!src) return;
        for (var _i4 = 0, _Object$keys4 = Object.keys(mods.effect); _i4 < _Object$keys4.length; _i4++) {
          var k = _Object$keys4[_i4];
          if (src[k]) mods.effect[k] += src[k] * scale;
        }
      }

      // 한 유닛의 전체 모디파이어를 계산한다.
      function collectUnitModifiers(unit) {
        var mods = emptyMods();

        // 1) 원형 고유 팀 버프 (예: SUPPORT의 팀 ATK +15%)
        var arch = getArchetype(unit.archetype);
        if (arch.teamBuff && arch.teamBuff.stat === 'atk') {
          mods.teamBuff.atk += arch.teamBuff.mult;
        }

        // 1-b) 전용(시그니처) 스킬 — 항상 발동, 랭크에 비례해 강해짐(정체성=성장)
        //      전용무기 보유 시 시그니처 강도가 증폭되고, 각성 시 2차 효과가 열린다.
        if (unit.signature) {
          var sig = getSkill(unit.signature);
          var scale = skillPower(unit.rank) * (1 + sigWeaponBoost(unit));
          addStatPct(mods, sig.statPct, scale);
          addEffect(mods, sig.effect, scale);
          addTeamBuff(mods, sig.teamBuff, scale);
          // 각성: 2차 효과 (각성 레벨 비례)
          var aw = unit.sigAwaken || 0;
          if (aw && sig.awaken) {
            addStatPct(mods, sig.awaken.statPct, aw);
            addEffect(mods, sig.awaken.effect, aw);
            addTeamBuff(mods, sig.awaken.teamBuff, aw);
          }
        }

        // 2) 장착 스킬 (슬롯별, 스킬 레벨에 비례)
        for (var _iterator = _createForOfIteratorHelperLoose(unit.skills || []), _step; !(_step = _iterator()).done;) {
          var slot = _step.value;
          if (!slot || !slot.id) continue;
          var skill = getSkill(slot.id);
          var _scale = skillPower(slot.level || 1);
          addStatPct(mods, skill.statPct, _scale);
          addEffect(mods, skill.effect, _scale);
          addTeamBuff(mods, skill.teamBuff, _scale);
        }

        // 3) 강화(각인) — 노드 레벨 × 노드당 증가값
        var enh = unit.enhance || {};
        for (var _i5 = 0, _arr = Object.entries(enh); _i5 < _arr.length; _i5++) {
          var _arr$_i = _arr[_i5],
            stat = _arr$_i[0],
            lvl = _arr$_i[1];
          if (!lvl) continue;
          var node = ENHANCE_NODES[stat];
          if (!node) continue;
          if (node.kind === 'statPct') mods.statPct[node.stat] += node.per * lvl;else if (node.kind === 'effect') mods.effect[node.stat] += node.per * lvl;
        }

        // 3-b) 친밀도 — 레벨당 전 스탯 % 보너스
        var ib = intimacyBonus(unit);
        if (ib) for (var _i6 = 0, _Object$keys5 = Object.keys(mods.statPct); _i6 < _Object$keys5.length; _i6++) {
          var k = _Object$keys5[_i6];
          mods.statPct[k] += ib;
        }

        // (코스튬은 순수 외형으로 전환 — 능력치 기여 없음. 레거시 costumeBonus 미적용)

        // 4) 장착 장비 — flat 스탯 + 전투 효과
        var gear = unit.gear || {};
        for (var _iterator2 = _createForOfIteratorHelperLoose(GEAR_SLOTS), _step2; !(_step2 = _iterator2()).done;) {
          var _slot = _step2.value;
          var item = gear[_slot];
          if (!item) continue;
          var c = gearContribution(item);
          addStatFlat(mods, c.flat);
          addStatPct(mods, c.statPct); // 부옵션 statPct
          addEffect(mods, c.effect);
        }
        // 4-b) 장비 세트 보너스 — 같은 세트 2/3피스 착용 시 추가 statPct/효과.
        var gs = gearSetBonus(unit);
        addStatPct(mods, gs.statPct);
        addEffect(mods, gs.effect);

        // 5) 전용무기 — 별도 슬롯(일반 장비와 무관)의 flat + 효과
        var sw = sigWeaponContribution(unit);
        if (sw) {
          addStatFlat(mods, sw.flat);
          addEffect(mods, sw.effect);
        }

        // 6) 룬 — 메인스탯 + 세트 보너스
        var rm = runeMainContribution(unit.runes);
        addStatPct(mods, rm.statPct);
        addEffect(mods, rm.effect);
        var rs = runeSetContribution(unit.runes);
        addStatPct(mods, rs.statPct);
        addEffect(mods, rs.effect);

        // 7) 씨앗 — 서사 발현(등급별 보정, 달성 조건분 statPct)
        addStatPct(mods, seedStatPct(unit));
        return mods;
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/nudges.ts", ['cc', './gacha.ts'], function (exports) {
  var cclegacy, PULL_COST;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      PULL_COST = module.PULL_COST;
    }],
    execute: function () {
      exports('spendNudges', spendNudges);
      cclegacy._RF.push({}, "6fa8ft+KFFLOZFh2FPZCteb", "nudges", undefined);

      // 10연차 1회분 이상 소환 재화가 쌓이면 알린다.
      var SUMMON_NUDGE = PULL_COST.summon * 10;
      function spendNudges(state) {
        var w = state.wallet || {};
        var out = [];
        if ((w.summon || 0) >= SUMMON_NUDGE) {
          var pulls = Math.floor((w.summon || 0) / (PULL_COST.summon * 10));
          out.push({
            key: 'summon',
            pulls: pulls,
            msg: "\uD83D\uDD2E \uC18C\uD658 \uC7AC\uD654 \uB109\uB109 \u2014 10\uC5F0 " + pulls + "\uD68C \uAC00\uB2A5"
          });
        }
        return out;
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/partyPresets.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './formation.ts'], function (exports) {
  var _extends, _createForOfIteratorHelperLoose, cclegacy, pruneFormation;
  return {
    setters: [function (module) {
      _extends = module.extends;
      _createForOfIteratorHelperLoose = module.createForOfIteratorHelperLoose;
    }, function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      pruneFormation = module.pruneFormation;
    }],
    execute: function () {
      exports({
        clearPreset: clearPreset,
        listPresetInfo: listPresetInfo,
        loadPreset: loadPreset,
        presetInfo: presetInfo,
        savePreset: savePreset
      });
      cclegacy._RF.push({}, "55a92oh5xtM6JYFT187oP5I", "partyPresets", undefined);

      // ─────────────────────────────────────────────────────────────
      // 편성 프리셋 — 파티 구성(멤버 + 진형)을 슬롯 1~5에 저장/불러오기.
      //   · 계정 로컬 저장(세이브에 포함). 유닛 uid를 그대로 참조하므로
      //     같은 계정 안에서만 유효 — 분해된 유닛은 불러오기 시 자동 제외.
      //   · 스테이지(방치)/보스(경쟁) 등 상황별로 덱을 빠르게 전환하는 용도.
      // ─────────────────────────────────────────────────────────────

      var PRESET_SLOTS = exports('PRESET_SLOTS', 5);
      function ensure(state) {
        state.formationPresets = state.formationPresets || {};
        return state.formationPresets;
      }

      // 현재 파티+진형을 슬롯에 저장(덮어쓰기).
      function savePreset(state, slot) {
        if (slot < 1 || slot > PRESET_SLOTS) return {
          ok: false,
          reason: '잘못된 슬롯'
        };
        if (!state.party || !state.party.length) return {
          ok: false,
          reason: '편성된 유닛이 없습니다'
        };
        var presets = ensure(state);
        presets[slot] = {
          party: [].concat(state.party),
          formation: _extends({}, state.formation || {}),
          savedAt: Date.now()
        };
        return {
          ok: true,
          slot: slot,
          count: state.party.length
        };
      }

      // 슬롯의 파티+진형을 현재 편성에 적용. 더 이상 보유하지 않은 유닛은 제외.
      function loadPreset(state, slot) {
        var presets = ensure(state);
        var p = presets[slot];
        if (!p) return {
          ok: false,
          reason: '저장된 편성이 없습니다'
        };
        var owned = new Set((state.units || []).map(function (u) {
          return u.uid;
        }));
        var party = p.party.filter(function (uid) {
          return owned.has(uid);
        });
        if (!party.length) return {
          ok: false,
          reason: '저장된 유닛을 더 이상 보유하지 않습니다'
        };
        state.party = party;
        var formation = {};
        for (var _iterator = _createForOfIteratorHelperLoose(party), _step; !(_step = _iterator()).done;) {
          var uid = _step.value;
          if (p.formation[uid]) formation[uid] = p.formation[uid];
        }
        state.formation = formation;
        pruneFormation(state);
        var missing = p.party.length - party.length;
        return {
          ok: true,
          slot: slot,
          applied: party.length,
          missing: missing
        };
      }

      // 슬롯 현황(UI 표시용) — 저장 여부·인원·저장 시각.
      function presetInfo(state, slot) {
        var presets = ensure(state);
        var p = presets[slot];
        if (!p) return {
          slot: slot,
          exists: false
        };
        return {
          slot: slot,
          exists: true,
          count: p.party.length,
          savedAt: p.savedAt
        };
      }
      function listPresetInfo(state) {
        var out = [];
        for (var i = 1; i <= PRESET_SLOTS; i++) out.push(presetInfo(state, i));
        return out;
      }
      function clearPreset(state, slot) {
        var presets = ensure(state);
        delete presets[slot];
        return {
          ok: true,
          slot: slot
        };
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/pets.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './economy.ts', './rng.ts', './materials.ts'], function (exports) {
  var _createForOfIteratorHelperLoose, cclegacy, spend, weightedPick, spendMaterial;
  return {
    setters: [function (module) {
      _createForOfIteratorHelperLoose = module.createForOfIteratorHelperLoose;
    }, function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      spend = module.spend;
    }, function (module) {
      weightedPick = module.weightedPick;
    }, function (module) {
      spendMaterial = module.spendMaterial;
    }],
    execute: function () {
      exports({
        autoFusePets: autoFusePets,
        equipPet: equipPet,
        petEffectLabel: petEffectLabel,
        petFuse: petFuse,
        petFuseAvail: petFuseAvail,
        petMods: petMods,
        petOptLabel: petOptLabel,
        petShardSummon: petShardSummon,
        petSummon: petSummon,
        rerollPetOpt: rerollPetOpt,
        unequipPet: unequipPet
      });
      cclegacy._RF.push({}, "b7f0aNyhSVFkZPmll9F9JO1", "pets", undefined);

      // 펫 등급 확률 (gacha와 분리해 순환 의존 방지).
      var PET_RARITY = [{
        id: 'R',
        weight: 65
      }, {
        id: 'SR',
        weight: 25
      }, {
        id: 'SSR',
        weight: 8
      }, {
        id: 'UR',
        weight: 2
      }];

      // ─────────────────────────────────────────────────────────────
      // 펫 — 계정 성장 축(유물과 형제). 차이: 수집(소환)+장착 루프가 있다.
      //   · 소환으로 획득, 중복은 레벨업(합성)
      //   · 최대 3마리 장착, 장착 펫 보너스만 accountMods에 합산
      //   · 다이아(gem) 소비처 → BM과 연결
      // 보너스 축은 power/currency/growth (accountMods와 동일).
      // ─────────────────────────────────────────────────────────────

      var PETS = exports('PETS', {
        P_CAT: {
          id: 'P_CAT',
          label: '럭키캣',
          emoji: '🐱',
          type: 'currency',
          rarity: 'R',
          per: 0.06
        },
        P_WOLF: {
          id: 'P_WOLF',
          label: '늑대',
          emoji: '🐺',
          type: 'power',
          rarity: 'R',
          per: 0.04
        },
        P_OWL: {
          id: 'P_OWL',
          label: '부엉이',
          emoji: '🦉',
          type: 'growth',
          rarity: 'R',
          per: 0.06
        },
        P_FOX: {
          id: 'P_FOX',
          label: '황금여우',
          emoji: '🦊',
          type: 'currency',
          rarity: 'SR',
          per: 0.09
        },
        P_BEAR: {
          id: 'P_BEAR',
          label: '큰곰',
          emoji: '🐻',
          type: 'power',
          rarity: 'SR',
          per: 0.07
        },
        P_TURTLE: {
          id: 'P_TURTLE',
          label: '거북',
          emoji: '🐢',
          type: 'growth',
          rarity: 'SR',
          per: 0.09
        },
        P_DRAGON: {
          id: 'P_DRAGON',
          label: '드래곤',
          emoji: '🐉',
          type: 'power',
          rarity: 'SSR',
          per: 0.12
        },
        // ── Phase B 신규 ──
        P_PHOENIX: {
          id: 'P_PHOENIX',
          label: '불사조',
          emoji: '🦅',
          type: 'power',
          rarity: 'SSR',
          per: 0.13
        },
        P_UNICORN: {
          id: 'P_UNICORN',
          label: '유니콘',
          emoji: '🦄',
          type: 'growth',
          rarity: 'SSR',
          per: 0.13
        },
        P_KRAKEN: {
          id: 'P_KRAKEN',
          label: '크라켄',
          emoji: '🐙',
          type: 'currency',
          rarity: 'SSR',
          per: 0.13
        },
        P_KIRIN: {
          id: 'P_KIRIN',
          label: '기린',
          emoji: '🐲',
          type: 'power',
          rarity: 'UR',
          per: 0.16
        },
        P_LEVIATHAN: {
          id: 'P_LEVIATHAN',
          label: '레비아탄',
          emoji: '🐋',
          type: 'currency',
          rarity: 'UR',
          per: 0.16
        }
      });
      var MAX_ACTIVE_PETS = exports('MAX_ACTIVE_PETS', 3);
      var PET_PULL_COST = exports('PET_PULL_COST', {
        gem: 30
      });

      // 펫 개체 옵션(부가 배수) — 소환 시 롤, 재련 가능. accountMods에 추가 합산.
      var PET_OPT_POOL = [{
        key: 'power',
        min: 0.02,
        max: 0.05
      }, {
        key: 'currency',
        min: 0.03,
        max: 0.07
      }, {
        key: 'growth',
        min: 0.03,
        max: 0.07
      }];
      function rollPetOpt(state, id, rng) {
        state.pets.opts = state.pets.opts || {};
        var p = PET_OPT_POOL[Math.floor(rng() * PET_OPT_POOL.length)];
        state.pets.opts[id] = {
          key: p.key,
          value: Math.round((p.min + rng() * (p.max - p.min)) * 1000) / 1000
        };
      }
      // 옵션 재련 — 다이아 소모.
      function rerollPetOpt(state, id, rng) {
        if (rng === void 0) {
          rng = Math.random;
        }
        if (!state.pets.owned[id]) return {
          ok: false,
          reason: '미보유 펫'
        };
        var cost = {
          gem: 15
        };
        if (!spend(state.wallet, cost)) return {
          ok: false,
          reason: '다이아 부족',
          cost: cost
        };
        rollPetOpt(state, id, rng);
        return {
          ok: true,
          opt: state.pets.opts[id],
          cost: cost
        };
      }

      // 펫 합성(승급) — 같은 등급 펫 보유레벨 FUSE_COST 소모 → 상위 등급 1 획득.
      var FUSE_NEXT = {
        R: 'SR',
        SR: 'SSR',
        SSR: 'UR'
      };
      var PET_FUSE_COST = exports('PET_FUSE_COST', 5);
      function petFuseAvail(state, rarity) {
        var n = 0;
        for (var _i = 0, _arr = Object.entries(state.pets.owned || {}); _i < _arr.length; _i++) {
          var _arr$_i = _arr[_i],
            id = _arr$_i[0],
            lv = _arr$_i[1];
          if (PETS[id] && PETS[id].rarity === rarity) n += lv;
        }
        return n;
      }
      function petFuse(state, rarity, rng) {
        if (rng === void 0) {
          rng = Math.random;
        }
        var next = FUSE_NEXT[rarity];
        if (!next) return {
          ok: false,
          reason: '최고 등급은 합성 불가'
        };
        if (petFuseAvail(state, rarity) < PET_FUSE_COST) {
          return {
            ok: false,
            reason: rarity + " \uD3AB \uB808\uBCA8 " + PET_FUSE_COST + " \uD544\uC694"
          };
        }
        // 소모: 해당 등급 펫들의 레벨을 차감(0이면 제거·장착 해제)
        var need = PET_FUSE_COST;
        var _loop = function _loop() {
            var id = _Object$keys[_i2];
            if (need <= 0) return 0; // break
            if (!PETS[id] || PETS[id].rarity !== rarity) return 1; // continue
            var take = Math.min(need, state.pets.owned[id]);
            state.pets.owned[id] -= take;
            need -= take;
            if (state.pets.owned[id] <= 0) {
              delete state.pets.owned[id];
              state.pets.active = state.pets.active.filter(function (x) {
                return x !== id;
              });
              if (state.pets.opts) delete state.pets.opts[id];
            }
          },
          _ret;
        for (var _i2 = 0, _Object$keys = Object.keys(state.pets.owned); _i2 < _Object$keys.length; _i2++) {
          _ret = _loop();
          if (_ret === 0) break;
          if (_ret === 1) continue;
        }
        // 상위 등급 펫 1 획득 + 옵션 롤
        var pool = Object.values(PETS).filter(function (p) {
          return p.rarity === next;
        });
        var pet = pool[Math.floor(rng() * pool.length)];
        var first = !state.pets.owned[pet.id];
        state.pets.owned[pet.id] = (state.pets.owned[pet.id] || 0) + 1;
        if (first) rollPetOpt(state, pet.id, rng);
        return {
          ok: true,
          pet: pet.id,
          rarity: next
        };
      }

      // ── QoL: 자동 합성 — 합성 가능한 모든 등급을 한 번에 승급(하위→상위 연쇄). ──
      // 스마트 필터(opts): 원하는 등급만 골라 합성해 "아끼는 등급"이 휩쓸리지 않게 한다.
      //   · opts.stopAt: 이 등급부터는 합성 안 함(그 아래만). 예 stopAt:'SSR' → R·SR만.
      //   · opts.only:   합성할 등급 화이트리스트(부분집합). 지정 시 그 등급만.
      // 기본(옵션 없음)은 기존 동작(R·SR·SSR 전부)과 동일 — 하위호환.
      function autoFusePets(state, rng, opts) {
        if (rng === void 0) {
          rng = Math.random;
        }
        if (opts === void 0) {
          opts = {};
        }
        var ALL = ['R', 'SR', 'SSR'];
        var stopIdx = opts.stopAt ? ALL.indexOf(opts.stopAt) : ALL.length;
        var order = ALL.filter(function (_, i) {
          return stopIdx < 0 ? true : i < stopIdx;
        });
        if (opts.only && opts.only.length) order = order.filter(function (r) {
          return opts.only.includes(r);
        });
        var fused = 0,
          guard = 0,
          progressed = true;
        while (progressed && guard++ < 100) {
          progressed = false;
          for (var _iterator = _createForOfIteratorHelperLoose(order), _step; !(_step = _iterator()).done;) {
            var rar = _step.value;
            while (petFuseAvail(state, rar) >= PET_FUSE_COST) {
              var r = petFuse(state, rar, rng);
              if (!r.ok) break;
              fused++;
              progressed = true;
            }
          }
        }
        return {
          ok: fused > 0,
          fused: fused
        };
      }
      function petEffectLabel(type, concept) {
        if (type === 'power') return '전투력';
        if (type === 'currency') return (concept ? concept.resources.currency.name : '골드') + " \uC218\uC785";
        return (concept ? concept.resources.growth.name : '정수') + " \uC218\uC785";
      }

      // 펫 소환: 다이아 소모 → 등급 확률로 펫 획득(중복은 레벨업), 빈 슬롯이면 자동 장착.
      function petSummon(state, rng) {
        if (rng === void 0) {
          rng = Math.random;
        }
        if (!spend(state.wallet, PET_PULL_COST)) return {
          ok: false,
          reason: '다이아 부족',
          cost: PET_PULL_COST
        };
        var rarity = weightedPick(PET_RARITY, rng);
        var pool = Object.values(PETS).filter(function (p) {
          return p.rarity === rarity.id;
        });
        var from = pool.length ? pool : Object.values(PETS);
        var pet = from[Math.floor(rng() * from.length)];
        var first = !state.pets.owned[pet.id];
        state.pets.owned[pet.id] = (state.pets.owned[pet.id] || 0) + 1;
        if (first) rollPetOpt(state, pet.id, rng); // 첫 획득 시 개체 옵션 롤
        if (state.pets.active.length < MAX_ACTIVE_PETS && !state.pets.active.includes(pet.id)) {
          state.pets.active.push(pet.id);
        }
        return {
          ok: true,
          pet: pet.id,
          rarity: rarity.id,
          level: state.pets.owned[pet.id]
        };
      }

      // 펫조각 소환 — 해당 등급 조각 SHARD_SUMMON_COST개로 그 등급 랜덤 펫 획득.
      var SHARD_SUMMON_COST = exports('SHARD_SUMMON_COST', 10);
      function petShardSummon(state, grade, rng) {
        if (rng === void 0) {
          rng = Math.random;
        }
        if (!spendMaterial(state, 'petShard', SHARD_SUMMON_COST, grade)) return {
          ok: false,
          reason: '펫조각 부족'
        };
        var pool = Object.values(PETS).filter(function (p) {
          return p.rarity === grade;
        });
        var from = pool.length ? pool : Object.values(PETS);
        var pet = from[Math.floor(rng() * from.length)];
        var first = !state.pets.owned[pet.id];
        state.pets.owned[pet.id] = (state.pets.owned[pet.id] || 0) + 1;
        if (first) rollPetOpt(state, pet.id, rng);
        if (state.pets.active.length < MAX_ACTIVE_PETS && !state.pets.active.includes(pet.id)) state.pets.active.push(pet.id);
        return {
          ok: true,
          pet: pet.id,
          grade: grade,
          level: state.pets.owned[pet.id]
        };
      }
      function equipPet(state, id) {
        if (!state.pets.owned[id]) return {
          ok: false,
          reason: '미보유'
        };
        if (state.pets.active.includes(id)) return {
          ok: false,
          reason: '이미 장착'
        };
        if (state.pets.active.length >= MAX_ACTIVE_PETS) return {
          ok: false,
          reason: '장착 슬롯 가득'
        };
        state.pets.active.push(id);
        return {
          ok: true
        };
      }
      function unequipPet(state, id) {
        state.pets.active = state.pets.active.filter(function (x) {
          return x !== id;
        });
        return {
          ok: true
        };
      }

      // 장착 펫들의 계정 배수 (power/currency/growth). 없으면 전부 1.
      function petMods(state) {
        var power = 1,
          currency = 1,
          growth = 1;
        var pets = state.pets;
        if (!pets) return {
          power: power,
          currency: currency,
          growth: growth
        };
        var add = function add(key, v) {
          if (key === 'power') power += v;else if (key === 'currency') currency += v;else growth += v;
        };
        for (var _iterator2 = _createForOfIteratorHelperLoose(pets.active || []), _step2; !(_step2 = _iterator2()).done;) {
          var id = _step2.value;
          var p = PETS[id];
          var lv = pets.owned[id] || 0;
          if (!p || !lv) continue;
          add(p.type, p.per * lv);
          // 개체 옵션 (부가 배수)
          var opt = pets.opts && pets.opts[id];
          if (opt) add(opt.key, opt.value);
        }
        return {
          power: power,
          currency: currency,
          growth: growth
        };
      }

      // 펫 옵션 표시 라벨.
      function petOptLabel(opt, concept) {
        if (!opt) return null;
        var name = opt.key === 'power' ? '전투력' : opt.key === 'currency' ? (concept ? concept.resources.currency.name : '골드') + ' 수입' : (concept ? concept.resources.growth.name : '정수') + ' 수입';
        return name + " +" + Math.round(opt.value * 100) + "%";
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/progression.ts", ['cc', './balance.ts', './elements.ts'], function (exports) {
  var cclegacy, BALANCE, ELEMENTS;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      BALANCE = module.BALANCE;
      exports('BALANCE', module.BALANCE);
    }, function (module) {
      ELEMENTS = module.ELEMENTS;
    }],
    execute: function () {
      exports({
        getStage: getStage,
        stageElement: stageElement,
        stageZone: stageZone
      });
      cclegacy._RF.push({}, "1ec97NHT3ZKvr+PIkUhf8Ax", "progression", undefined);

      // 속성 구역(밴드) — 층을 STAGE_BAND개씩 한 속성으로 묶어 예측 가능하게 나눈다.
      //   층1~3 불 · 4~6 물 · 7~9 숲 · 10~12 빛 · 13~15 어둠 · 16~18 불 …
      var STAGE_BAND = exports('STAGE_BAND', 3);
      function stageElement(stage) {
        return ELEMENTS[Math.floor((stage - 1) / STAGE_BAND) % ELEMENTS.length];
      }
      // 구역 정보 (UI 표시용): 현재 속성, 구역 시작/끝, 다음 구역 속성.
      function stageZone(stage) {
        var idx = Math.floor((stage - 1) / STAGE_BAND);
        var start = idx * STAGE_BAND + 1;
        return {
          element: stageElement(stage),
          start: start,
          end: start + STAGE_BAND - 1,
          within: stage - start + 1,
          size: STAGE_BAND,
          nextElement: ELEMENTS[(idx + 1) % ELEMENTS.length]
        };
      }

      // stage: 1부터 시작하는 정수
      function getStage(stage) {
        var g = Math.pow(BALANCE.enemyGrowth, stage - 1);
        var r = Math.pow(BALANCE.rewardGrowth, stage - 1);
        return {
          stage: stage,
          challenge: {
            hp: Math.round(BALANCE.enemyBase.hp * g),
            atk: Math.round(BALANCE.enemyBase.atk * g),
            def: Math.round(BALANCE.enemyBase.def * g),
            element: stageElement(stage) // 속성 구역(밴드)
          },

          rewards: {
            // 컨셉 무관한 자원 키. 컨셉이 표시명을 붙인다.
            currency: Math.round(BALANCE.rewardBase.currency * r),
            growth: Math.round(BALANCE.rewardBase.growth * r)
          }
        };
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/relics.ts", ['cc', './economy.ts'], function (exports) {
  var cclegacy, spend;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      spend = module.spend;
    }],
    execute: function () {
      exports({
        relicCap: relicCap,
        relicMods: relicMods,
        relicUpgradeCost: relicUpgradeCost,
        upgradeRelic: upgradeRelic
      });
      cclegacy._RF.push({}, "784a6dq/3tMmYrv7oc3IQJZ", "relics", undefined);

      // ─────────────────────────────────────────────────────────────
      // 유물(Relic) — 계정 단위 영구 성장. 환생 배수와 함께 accountMods로 합산된다.
      // 유닛과 무관하게 계정 전체에 곱해지는 배수라, 장기 성장 축을 만든다.
      // 3종 유물이 처음부터 존재(레벨 0)하고 currency로 강화한다(성장 재화 싱크).
      // ─────────────────────────────────────────────────────────────

      // 유물 — kind(power/currency/growth)별 계정 배수. rarity가 효율·상한을 정한다.
      var RELICS = exports('RELICS', {
        // 기본(R) 3종
        R_POWER: {
          id: 'R_POWER',
          kind: 'power',
          per: 0.03,
          rarity: 'R',
          emoji: '⚔️',
          label: '전투의 성물'
        },
        R_GOLD: {
          id: 'R_GOLD',
          kind: 'currency',
          per: 0.05,
          rarity: 'R',
          emoji: '🪙',
          label: '황금 우상'
        },
        R_GROWTH: {
          id: 'R_GROWTH',
          kind: 'growth',
          per: 0.05,
          rarity: 'R',
          emoji: '💠',
          label: '정수의 결정'
        },
        // 상위(SR) — 효율↑·상한↑
        R_WARLORD: {
          id: 'R_WARLORD',
          kind: 'power',
          per: 0.05,
          rarity: 'SR',
          emoji: '🗡️',
          label: '군신의 인장'
        },
        R_TREASURY: {
          id: 'R_TREASURY',
          kind: 'currency',
          per: 0.08,
          rarity: 'SR',
          emoji: '💰',
          label: '보물고 열쇠'
        },
        R_SAGE: {
          id: 'R_SAGE',
          kind: 'growth',
          per: 0.08,
          rarity: 'SR',
          emoji: '📜',
          label: '현자의 서'
        },
        // 전설(SSR) — 최고 효율
        R_TITAN: {
          id: 'R_TITAN',
          kind: 'power',
          per: 0.08,
          rarity: 'SSR',
          emoji: '🔱',
          label: '거신의 심장'
        },
        R_MIDAS: {
          id: 'R_MIDAS',
          kind: 'currency',
          per: 0.11,
          rarity: 'SSR',
          emoji: '👑',
          label: '마이더스의 손'
        }
      });

      // 등급별 강화 상한 — 상위 유물일수록 더 오래 성장.
      var RELIC_RARITY_CAP = exports('RELIC_RARITY_CAP', {
        R: 20,
        SR: 30,
        SSR: 40
      });
      var RELIC_CAP = exports('RELIC_CAP', 20); // 하위호환 기본값

      function relicCap(id) {
        var r = RELICS[id];
        return r && RELIC_RARITY_CAP[r.rarity] || RELIC_CAP;
      }
      function relicUpgradeCost(level) {
        return {
          currency: Math.round(500 * Math.pow(1.5, level))
        };
      }
      function upgradeRelic(state, id) {
        if (!RELICS[id]) return {
          ok: false,
          reason: '알 수 없는 유물'
        };
        var cap = relicCap(id);
        var lv = state.relics && state.relics[id] || 0;
        if (lv >= cap) return {
          ok: false,
          reason: "\uAC15\uD654 \uC0C1\uD55C " + cap
        };
        var cost = relicUpgradeCost(lv);
        if (!spend(state.wallet, cost)) return {
          ok: false,
          reason: '재화 부족',
          cost: cost
        };
        state.relics = state.relics || {};
        state.relics[id] = lv + 1;
        return {
          ok: true,
          id: id,
          level: lv + 1,
          cost: cost
        };
      }

      // 계정 배수 (power / currency / growth). 유물 없으면 전부 1.
      function relicMods(state) {
        var power = 1,
          currency = 1,
          growth = 1;
        var owned = state.relics || {};
        for (var _i = 0, _arr = Object.entries(owned); _i < _arr.length; _i++) {
          var _arr$_i = _arr[_i],
            id = _arr$_i[0],
            lv = _arr$_i[1];
          var r = RELICS[id];
          if (!r || !lv) continue;
          if (r.kind === 'power') power += r.per * lv;else if (r.kind === 'currency') currency += r.per * lv;else if (r.kind === 'growth') growth += r.per * lv;
        }
        return {
          power: power,
          currency: currency,
          growth: growth
        };
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/rentals.ts", ['cc', './economy.ts'], function (exports) {
  var cclegacy, spend;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      spend = module.spend;
    }],
    execute: function () {
      exports({
        pruneRentals: pruneRentals,
        rent: rent,
        rentalActive: rentalActive,
        rentalDef: rentalDef,
        rentalMods: rentalMods,
        rentalMsLeft: rentalMsLeft,
        rentalState: rentalState,
        rentalTier: rentalTier,
        rentalTierDef: rentalTierDef
      });
      cclegacy._RF.push({}, "961b6ppX7NLkaenDm9sGi3q", "rentals", undefined);

      // ─────────────────────────────────────────────────────────────
      // 기간제 대여(렌트) — 유료 BM. 일정 기간 상위 성능 아이템을 빌린다.
      //   · 결제 → 해당 슬롯에 tier + 만료시각(expiresAt) 설정.
      //   · 추가 결제(상위 tier) → 등급 교체 + 기간 리셋.
      //   · 미결제 → 기간 종료 시 효과 소멸(active 판정이 자동 처리).
      // 활성 렌트만 accountMods(power/currency)에 곱해진다.
      // 상태: state.rentals = { [slotId]: { tier, expiresAt } }.
      // ─────────────────────────────────────────────────────────────

      var DAY = 86400000;
      var RENTAL_CATALOG = exports('RENTAL_CATALOG', {
        RENT_WEAPON: {
          id: 'RENT_WEAPON',
          label: '대여 전투장비',
          emoji: '🗡️',
          kind: 'power',
          tiers: [{
            tier: 1,
            per: 0.15,
            days: 7,
            gem: 120,
            krw: '₩3,300'
          }, {
            tier: 2,
            per: 0.30,
            days: 7,
            gem: 240,
            krw: '₩6,600'
          }, {
            tier: 3,
            per: 0.50,
            days: 7,
            gem: 420,
            krw: '₩12,000'
          }]
        },
        RENT_ACCESSORY: {
          id: 'RENT_ACCESSORY',
          label: '대여 악세서리',
          emoji: '💍',
          kind: 'currency',
          tiers: [{
            tier: 1,
            per: 0.20,
            days: 7,
            gem: 100,
            krw: '₩2,900'
          }, {
            tier: 2,
            per: 0.40,
            days: 7,
            gem: 200,
            krw: '₩5,500'
          }, {
            tier: 3,
            per: 0.70,
            days: 7,
            gem: 360,
            krw: '₩9,900'
          }]
        },
        RENT_RELIC: {
          id: 'RENT_RELIC',
          label: '대여 유물',
          emoji: '🔱',
          kind: 'power',
          tiers: [{
            tier: 1,
            per: 0.25,
            days: 30,
            gem: 300,
            krw: '₩9,900'
          }, {
            tier: 2,
            per: 0.50,
            days: 30,
            gem: 560,
            krw: '₩19,000'
          }, {
            tier: 3,
            per: 0.90,
            days: 30,
            gem: 900,
            krw: '₩29,000'
          }]
        }
      });
      function rentalDef(id) {
        return RENTAL_CATALOG[id] || null;
      }
      function rentalTierDef(id, tier) {
        var d = RENTAL_CATALOG[id];
        return d ? d.tiers.find(function (t) {
          return t.tier === tier;
        }) || null : null;
      }

      // 현재 활성 렌트 상태 (없거나 만료면 null).
      function rentalState(state, id, now) {
        if (now === void 0) {
          now = Date.now();
        }
        var r = state.rentals && state.rentals[id];
        if (!r || !r.expiresAt || now >= r.expiresAt) return null;
        return r;
      }
      function rentalActive(state, id, now) {
        if (now === void 0) {
          now = Date.now();
        }
        return !!rentalState(state, id, now);
      }
      function rentalTier(state, id, now) {
        if (now === void 0) {
          now = Date.now();
        }
        var r = rentalState(state, id, now);
        return r ? r.tier : 0;
      }
      function rentalMsLeft(state, id, now) {
        if (now === void 0) {
          now = Date.now();
        }
        var r = rentalState(state, id, now);
        return r ? r.expiresAt - now : 0;
      }

      // 활성 렌트들의 계정 배수 (power/currency). growth는 렌트 없음.
      function rentalMods(state, now) {
        if (now === void 0) {
          now = Date.now();
        }
        var power = 1,
          currency = 1;
        if (!state.rentals) return {
          power: power,
          currency: currency
        };
        for (var _i = 0, _Object$keys = Object.keys(state.rentals); _i < _Object$keys.length; _i++) {
          var id = _Object$keys[_i];
          var r = rentalState(state, id, now);
          if (!r) continue;
          var def = RENTAL_CATALOG[id];
          var td = rentalTierDef(id, r.tier);
          if (!def || !td) continue;
          if (def.kind === 'power') power += td.per;else if (def.kind === 'currency') currency += td.per;
        }
        return {
          power: power,
          currency: currency
        };
      }

      // 렌트 결제 — 지정 tier 구매. 상위 tier면 교체+기간 리셋, 동일 tier면 연장.
      function rent(state, id, tier, now) {
        if (now === void 0) {
          now = Date.now();
        }
        var td = rentalTierDef(id, tier);
        if (!td) return {
          ok: false,
          reason: '알 수 없는 상품'
        };
        var cost = {
          gem: td.gem
        };
        if (!spend(state.wallet, cost)) return {
          ok: false,
          reason: '다이아 부족',
          cost: cost
        };
        state.rentals = state.rentals || {};
        var cur = rentalState(state, id, now);
        // 동일 tier 재결제면 남은 기간에 이어붙임(연장), 아니면 기간 리셋.
        var base = cur && cur.tier === tier ? cur.expiresAt : now;
        state.rentals[id] = {
          tier: tier,
          expiresAt: base + td.days * DAY
        };
        return {
          ok: true,
          id: id,
          tier: tier,
          expiresAt: state.rentals[id].expiresAt,
          cost: cost
        };
      }

      // 만료된 렌트 정리(선택적 — active 판정이 이미 처리하지만 세이브를 깔끔히).
      function pruneRentals(state, now) {
        if (now === void 0) {
          now = Date.now();
        }
        if (!state.rentals) return;
        for (var _i2 = 0, _Object$keys2 = Object.keys(state.rentals); _i2 < _Object$keys2.length; _i2++) {
          var id = _Object$keys2[_i2];
          var r = state.rentals[id];
          if (!r || !r.expiresAt || now >= r.expiresAt) delete state.rentals[id];
        }
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/resolution.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './units.ts', './elements.ts', './synergy.ts', './formation.ts'], function (exports) {
  var _createForOfIteratorHelperLoose, cclegacy, toCombatProfile, affinity, teamSynergy, formationActive, hasFrontLine, formationModsFor;
  return {
    setters: [function (module) {
      _createForOfIteratorHelperLoose = module.createForOfIteratorHelperLoose;
    }, function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      toCombatProfile = module.toCombatProfile;
    }, function (module) {
      affinity = module.affinity;
    }, function (module) {
      teamSynergy = module.teamSynergy;
    }, function (module) {
      formationActive = module.formationActive;
      hasFrontLine = module.hasFrontLine;
      formationModsFor = module.formationModsFor;
    }],
    execute: function () {
      exports({
        combatContributions: combatContributions,
        resolve: resolve,
        resolvePvP: resolvePvP
      });
      cclegacy._RF.push({}, "8dc04qdveVHE5XC25v1Matg", "resolution", undefined);

      // ─────────────────────────────────────────────────────────────
      // 전투 판정 엔진 — 시스템의 심장.
      // 파티 vs 도전(challenge)을 결정론적으로 계산해
      //   { win, duration } 를 반환한다.
      //
      //   · win      : RPG 장르가 사용 (승패로 진행 게이팅)
      //   · duration : 방치형 장르가 사용 (클리어 소요 초 → 초당 보상)
      //
      // 스킬 전투 효과를 반영한다:
      //   치명타 → dps에 이미 반영(프로필 단계)
      //   흡혈(lifesteal)  → 파티 유효 HP 증가
      //   관통(defPierce)  → 적 방어 무시
      //   팀버프(teamBuffAtk) → 파티 dps 배수
      // ─────────────────────────────────────────────────────────────

      // 방어(def)에 의한 피해 감쇠 계수: 100/(100+def)
      function mitigation(def) {
        return 100 / (100 + Math.max(0, def));
      }

      // challenge 형태: { hp, atk, def }  (스칼라 적)
      // accountMods.powerMult: 계정 단위 영구 파워 배수(환생 보너스 등). 기본 1.
      function resolve(party, challenge, accountMods, formation) {
        if (accountMods === void 0) {
          accountMods = {};
        }
        if (formation === void 0) {
          formation = null;
        }
        if (!party.length) return {
          win: false,
          duration: Infinity,
          log: '파티 없음'
        };
        var powerMult = accountMods.powerMult || 1;
        var profiles = party.map(toCombatProfile);
        // 진형: 후열이 1명 이상일 때만 발동(하위호환). 전열=방어벽, 후열=보호받는 딜러.
        if (formationActive(formation, party)) {
          var hasFront = hasFrontLine(formation, party);
          for (var _iterator = _createForOfIteratorHelperLoose(profiles), _step; !(_step = _iterator()).done;) {
            var p = _step.value;
            var m = formationModsFor(formation, p.uid, hasFront);
            p.dps *= m.dps || 1;
            p.def *= m.def || 1;
            p.hp *= m.hp || 1;
          }
        }
        // 파티 구성 시너지 (삼위일체·진형·속성 결속) — 팀 전체 배수
        var syn = teamSynergy(party).mult;

        // 팀 버프 합산 (지원형 원형 + 지휘 스킬 등)
        var atkMult = 1 + profiles.reduce(function (s, p) {
          return s + (p.teamBuffAtk || 0);
        }, 0);
        // 팀 치명 버프 → 파티 dps 배수 (치명 지원형)
        var critMult = 1 + profiles.reduce(function (s, p) {
          return s + (p.teamBuffCrit || 0);
        }, 0);
        // 팀 방어 버프 → 파티 피해경감 (수호 지원형, 상한 60%)
        var teamDefReduce = Math.min(0.6, profiles.reduce(function (s, p) {
          return s + (p.teamBuffDef || 0);
        }, 0));
        // 흡혈 합산 (상한 60%) → 파티 실효 HP 증가
        var lifesteal = Math.min(0.6, profiles.reduce(function (s, p) {
          var _p$effect;
          return s + (((_p$effect = p.effect) == null ? void 0 : _p$effect.lifesteal) || 0);
        }, 0));
        // 방어 관통은 파티 내 최댓값 사용
        var defPierce = Math.min(0.9, Math.max.apply(Math, [0].concat(profiles.map(function (p) {
          var _p$effect2;
          return ((_p$effect2 = p.effect) == null ? void 0 : _p$effect2.defPierce) || 0;
        }))));
        // 받는 피해 감소 — 파티 평균(상한 60%). 방어와 별개의 생존 축.
        var dmgReduce = Math.min(0.6, profiles.reduce(function (s, p) {
          var _p$effect3;
          return s + (((_p$effect3 = p.effect) == null ? void 0 : _p$effect3.dmgReduce) || 0);
        }, 0) / profiles.length);
        // ── 신규 능력치 ──
        // 절대공격(고정 딜) — 방어 감쇠를 우회하는 딜 비율. 파티 최댓값(상한 90%).
        var trueDamage = Math.min(0.9, Math.max.apply(Math, [0].concat(profiles.map(function (p) {
          var _p$effect4;
          return ((_p$effect4 = p.effect) == null ? void 0 : _p$effect4.trueDamage) || 0;
        }))));
        // 명중 — 적 회피를 상쇄(파티 최댓값). 회피 — 파티 평균으로 적 명중 대비 회피율(상한 50%).
        var accuracy = Math.max.apply(Math, [0].concat(profiles.map(function (p) {
          var _p$effect5;
          return ((_p$effect5 = p.effect) == null ? void 0 : _p$effect5.accuracy) || 0;
        })));
        var evasion = profiles.reduce(function (s, p) {
          var _p$effect6;
          return s + (((_p$effect6 = p.effect) == null ? void 0 : _p$effect6.evasion) || 0);
        }, 0) / profiles.length;
        // 절대방어 — 상한(피해감소 60%)을 우회하는 별도 경감(상한 50%). 파티 평균.
        var absDef = Math.min(0.5, profiles.reduce(function (s, p) {
          var _p$effect7;
          return s + (((_p$effect7 = p.effect) == null ? void 0 : _p$effect7.absDef) || 0);
        }, 0) / profiles.length);
        // 적 회피/명중(고난이도·보스에서 부여). 우리 명중이 적 회피를, 적 명중이 우리 회피를 상쇄.
        var enemyEva = Math.min(0.9, Math.max(0, (challenge.eva || 0) - accuracy));
        var effEvasion = Math.min(0.5, Math.max(0, evasion - (challenge.acc || 0)));
        var partyHP = profiles.reduce(function (s, p) {
          return s + p.hp;
        }, 0);
        var partyHPeff = partyHP * (1 + lifesteal) * powerMult * syn.hp;
        // 각 유닛의 dps에 속성 상성 배수 적용 (적 속성 대비 유리/불리)
        var rawDPS = profiles.reduce(function (s, p) {
          return s + p.dps * affinity(p.element, challenge.element);
        }, 0) * atkMult * critMult * powerMult * syn.atk;
        var avgDef = profiles.reduce(function (s, p) {
          return s + p.def;
        }, 0) / profiles.length * syn.def;
        var enemyDefEff = challenge.def * (1 - defPierce);
        // 방어 감쇠 후 통과율. 절대공격은 감쇠된 부분 일부를 고정 딜로 회수(상한 100%).
        var mitig = mitigation(enemyDefEff);
        var throughput = mitig + trueDamage * (1 - mitig);
        // 파티가 적에게 넣는 유효 DPS (적 방어 + 절대공격 + 적 회피 반영)
        var partyEffDPS = Math.max(1, rawDPS * throughput * (1 - enemyEva));
        // 적이 파티에게 넣는 유효 DPS (방어 + 팀방어 + 받는피해감소 + 절대방어 + 회피 반영)
        var enemyEffDPS = Math.max(1, challenge.atk * mitigation(avgDef) * (1 - teamDefReduce) * (1 - dmgReduce) * (1 - absDef) * (1 - effEvasion));
        var timeToKillEnemy = challenge.hp / partyEffDPS;
        var timeToKillParty = partyHPeff / enemyEffDPS;
        var win = timeToKillEnemy <= timeToKillParty;
        return {
          win: win,
          duration: win ? timeToKillEnemy : timeToKillParty,
          // 초
          // 승부 여유: 파티전멸시간/적처치시간. >1이면 승리, 클수록 여유.
          margin: timeToKillParty / timeToKillEnemy,
          partyPower: Math.round(rawDPS),
          partyHP: Math.round(partyHPeff),
          log: win ? "\uC2B9\uB9AC (" + timeToKillEnemy.toFixed(1) + "\uCD08 \uC18C\uC694)" : "\uD328\uBC30 (" + timeToKillParty.toFixed(1) + "\uCD08 \uBC84\uD300)"
        };
      }

      // ─────────────────────────────────────────────────────────────
      // 전투 통계(DPS 미터) — 유저가 "누가 딜을 못 넣나"를 분석하도록 유닛별 기여를 노출.
      //   판정 엔진과 같은 규약(진형·속성 상성·치명)을 써서 화면에 그대로 신뢰할 수 있게 한다.
      //   반환: { units:[{uid, dps, hp, dpsShare, hpShare, element, affinity}], totalDPS, totalHP }
      //   dpsShare/hpShare = 파티 내 비중(0~1). 덱 수정의 근거를 제공한다.
      // ─────────────────────────────────────────────────────────────
      function combatContributions(party, challenge, accountMods, formation) {
        if (challenge === void 0) {
          challenge = {};
        }
        if (accountMods === void 0) {
          accountMods = {};
        }
        if (formation === void 0) {
          formation = null;
        }
        if (!party || !party.length) return {
          units: [],
          totalDPS: 0,
          totalHP: 0
        };
        var powerMult = accountMods.powerMult || 1;
        var profiles = party.map(toCombatProfile);
        if (formationActive(formation, party)) {
          var hasFront = hasFrontLine(formation, party);
          for (var _iterator2 = _createForOfIteratorHelperLoose(profiles), _step2; !(_step2 = _iterator2()).done;) {
            var p = _step2.value;
            var m = formationModsFor(formation, p.uid, hasFront);
            p.dps *= m.dps || 1;
            p.def *= m.def || 1;
            p.hp *= m.hp || 1;
          }
        }
        var syn = teamSynergy(party).mult;
        var atkMult = (1 + profiles.reduce(function (s, p) {
          return s + (p.teamBuffAtk || 0);
        }, 0)) * (1 + profiles.reduce(function (s, p) {
          return s + (p.teamBuffCrit || 0);
        }, 0));
        var rows = profiles.map(function (p) {
          var aff = affinity(p.element, challenge.element);
          return {
            uid: p.uid,
            element: p.element,
            affinity: aff,
            // 속성 상성 배수(>1 유리, <1 불리)
            dps: p.dps * aff * atkMult * powerMult * syn.atk,
            hp: p.hp * powerMult * syn.hp
          };
        });
        var totalDPS = rows.reduce(function (s, r) {
          return s + r.dps;
        }, 0) || 1;
        var totalHP = rows.reduce(function (s, r) {
          return s + r.hp;
        }, 0) || 1;
        for (var _iterator3 = _createForOfIteratorHelperLoose(rows), _step3; !(_step3 = _iterator3()).done;) {
          var r = _step3.value;
          r.dpsShare = r.dps / totalDPS;
          r.hpShare = r.hp / totalHP;
          r.dps = Math.round(r.dps);
          r.hp = Math.round(r.hp);
        }
        // 딜 비중 내림차순(주력·비주력 즉시 식별).
        rows.sort(function (a, b) {
          return b.dpsShare - a.dpsShare;
        });
        return {
          units: rows,
          totalDPS: Math.round(totalDPS),
          totalHP: Math.round(totalHP)
        };
      }

      // ─────────────────────────────────────────────────────────────
      // PvP 판정 — 파티 vs 파티(비동기). resolve()와 "완전히 같은" 스탯 공식을 쓰되,
      // 스칼라 적 대신 방어 파티를 집계해 대칭으로 겨룬다.
      //   양측 유효 DPS·유효 HP를 구해 서로의 처치시간을 비교(짧은 쪽 승).
      //   속성 상성은 각 파티의 "대표(최다) 속성"으로 근사한다(결정론 유지).
      // ─────────────────────────────────────────────────────────────

      // 한 파티를 전투 집계로 환산(공격·생존 지표). resolve() 내부 로직과 동일 규약.
      function aggregateSide(party, accountMods, formation) {
        if (accountMods === void 0) {
          accountMods = {};
        }
        if (formation === void 0) {
          formation = null;
        }
        var powerMult = accountMods.powerMult || 1;
        var profiles = party.map(toCombatProfile);
        if (formationActive(formation, party)) {
          var hasFront = hasFrontLine(formation, party);
          for (var _iterator4 = _createForOfIteratorHelperLoose(profiles), _step4; !(_step4 = _iterator4()).done;) {
            var p = _step4.value;
            var m = formationModsFor(formation, p.uid, hasFront);
            p.dps *= m.dps || 1;
            p.def *= m.def || 1;
            p.hp *= m.hp || 1;
          }
        }
        var syn = teamSynergy(party).mult;
        var n = profiles.length || 1;
        var atkMult = 1 + profiles.reduce(function (s, p) {
          return s + (p.teamBuffAtk || 0);
        }, 0);
        var critMult = 1 + profiles.reduce(function (s, p) {
          return s + (p.teamBuffCrit || 0);
        }, 0);
        var teamDefReduce = Math.min(0.6, profiles.reduce(function (s, p) {
          return s + (p.teamBuffDef || 0);
        }, 0));
        var lifesteal = Math.min(0.6, profiles.reduce(function (s, p) {
          var _p$effect8;
          return s + (((_p$effect8 = p.effect) == null ? void 0 : _p$effect8.lifesteal) || 0);
        }, 0));
        var defPierce = Math.min(0.9, Math.max.apply(Math, [0].concat(profiles.map(function (p) {
          var _p$effect9;
          return ((_p$effect9 = p.effect) == null ? void 0 : _p$effect9.defPierce) || 0;
        }))));
        var dmgReduce = Math.min(0.6, profiles.reduce(function (s, p) {
          var _p$effect10;
          return s + (((_p$effect10 = p.effect) == null ? void 0 : _p$effect10.dmgReduce) || 0);
        }, 0) / n);
        var trueDamage = Math.min(0.9, Math.max.apply(Math, [0].concat(profiles.map(function (p) {
          var _p$effect11;
          return ((_p$effect11 = p.effect) == null ? void 0 : _p$effect11.trueDamage) || 0;
        }))));
        var accuracy = Math.max.apply(Math, [0].concat(profiles.map(function (p) {
          var _p$effect12;
          return ((_p$effect12 = p.effect) == null ? void 0 : _p$effect12.accuracy) || 0;
        })));
        var evasion = profiles.reduce(function (s, p) {
          var _p$effect13;
          return s + (((_p$effect13 = p.effect) == null ? void 0 : _p$effect13.evasion) || 0);
        }, 0) / n;
        var absDef = Math.min(0.5, profiles.reduce(function (s, p) {
          var _p$effect14;
          return s + (((_p$effect14 = p.effect) == null ? void 0 : _p$effect14.absDef) || 0);
        }, 0) / n);
        var ehp = profiles.reduce(function (s, p) {
          return s + p.hp;
        }, 0) * (1 + lifesteal) * powerMult * syn.hp;
        var avgDef = profiles.reduce(function (s, p) {
          return s + p.def;
        }, 0) / n * syn.def;
        var baseDPS = profiles.reduce(function (s, p) {
          return s + p.dps;
        }, 0) * atkMult * critMult * powerMult * syn.atk;
        // 대표 속성(최다). 동률이면 먼저 나온 것.
        var elem = {};
        for (var _iterator5 = _createForOfIteratorHelperLoose(profiles), _step5; !(_step5 = _iterator5()).done;) {
          var _p = _step5.value;
          if (_p.element) elem[_p.element] = (elem[_p.element] || 0) + 1;
        }
        var dominant = null,
          best = 0;
        for (var _i = 0, _Object$entries = Object.entries(elem); _i < _Object$entries.length; _i++) {
          var _Object$entries$_i = _Object$entries[_i],
            e = _Object$entries$_i[0],
            c = _Object$entries$_i[1];
          if (c > best) {
            best = c;
            dominant = e;
          }
        }
        return {
          baseDPS: baseDPS,
          ehp: ehp,
          avgDef: avgDef,
          defPierce: defPierce,
          dmgReduce: dmgReduce,
          teamDefReduce: teamDefReduce,
          trueDamage: trueDamage,
          accuracy: accuracy,
          evasion: evasion,
          absDef: absDef,
          dominant: dominant
        };
      }

      // A가 B에게 실제로 넣는 유효 DPS (방어감쇠·절대공격·회피·상성·받는피해감소·절대방어 반영).
      function effDPSbetween(atk, def) {
        var mitig = mitigation(def.avgDef * (1 - atk.defPierce));
        var throughput = mitig + atk.trueDamage * (1 - mitig);
        var enemyEva = Math.min(0.5, Math.max(0, def.evasion - atk.accuracy));
        var aff = affinity(atk.dominant, def.dominant);
        var incoming = (1 - def.teamDefReduce) * (1 - def.dmgReduce) * (1 - def.absDef);
        return Math.max(1, atk.baseDPS * throughput * (1 - enemyEva) * aff * incoming);
      }
      function resolvePvP(attacker, defender, aMods, dMods, aForm, dForm) {
        if (aMods === void 0) {
          aMods = {};
        }
        if (dMods === void 0) {
          dMods = {};
        }
        if (aForm === void 0) {
          aForm = null;
        }
        if (dForm === void 0) {
          dForm = null;
        }
        if (!attacker || !attacker.length) return {
          win: false,
          margin: 0,
          log: '공격 파티 없음'
        };
        if (!defender || !defender.length) return {
          win: true,
          margin: Infinity,
          log: '방어 파티 없음'
        };
        var A = aggregateSide(attacker, aMods, aForm);
        var D = aggregateSide(defender, dMods, dForm);
        var aEff = effDPSbetween(A, D); // 공격자가 방어자에게
        var dEff = effDPSbetween(D, A); // 방어자가 공격자에게
        var ta = D.ehp / aEff; // 공격자가 방어자를 처치하는 시간
        var td = A.ehp / dEff; // 방어자가 공격자를 처치하는 시간
        var win = ta <= td; // 동률은 선공(공격자) 승
        return {
          win: win,
          margin: td / ta,
          attackerPower: Math.round(A.baseDPS),
          defenderPower: Math.round(D.baseDPS),
          ta: ta,
          td: td,
          log: win ? "\uACF5\uACA9 \uC2B9\uB9AC (" + ta.toFixed(1) + "\uCD08)" : "\uBC29\uC5B4 \uC131\uACF5 (" + td.toFixed(1) + "\uCD08)"
        };
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/rng.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc'], function (exports) {
  var _createForOfIteratorHelperLoose, cclegacy;
  return {
    setters: [function (module) {
      _createForOfIteratorHelperLoose = module.createForOfIteratorHelperLoose;
    }, function (module) {
      cclegacy = module.cclegacy;
    }],
    execute: function () {
      exports({
        makeRng: makeRng,
        weightedPick: weightedPick
      });
      cclegacy._RF.push({}, "57a75z9waVKi6eZdg2N+J6n", "rng", undefined);
      // ─────────────────────────────────────────────────────────────
      // 난수 — 가차처럼 확률이 필요한 곳에만 쓴다.
      // Core의 나머지는 결정론적이므로, RNG는 "주입"한다.
      // 시드를 주면 재현 가능 → 테스트/밸런싱에 유리.
      // ─────────────────────────────────────────────────────────────

      // mulberry32: 작고 빠른 시드 PRNG. [0,1) 반환.
      function makeRng(seed) {
        if (seed === void 0) {
          seed = 0x9e3779b9;
        }
        var a = seed >>> 0;
        return function next() {
          a |= 0;
          a = a + 0x6d2b79f5 | 0;
          var t = Math.imul(a ^ a >>> 15, 1 | a);
          t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
          return ((t ^ t >>> 14) >>> 0) / 4294967296;
        };
      }

      // 가중치 목록에서 하나 고르기. entries: [{ weight, ...}, ...]
      function weightedPick(entries, rng) {
        var total = entries.reduce(function (s, e) {
          return s + e.weight;
        }, 0);
        var roll = rng() * total;
        for (var _iterator = _createForOfIteratorHelperLoose(entries), _step; !(_step = _iterator()).done;) {
          var e = _step.value;
          roll -= e.weight;
          if (roll < 0) return e;
        }
        return entries[entries.length - 1];
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/roles.ts", ['cc'], function (exports) {
  var cclegacy;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }],
    execute: function () {
      exports({
        allowedActions: allowedActions,
        atLeast: atLeast,
        can: can,
        isRole: isRole,
        normalizeRole: normalizeRole,
        roleRank: roleRank
      });
      cclegacy._RF.push({}, "7ebdci0ovNFgbn6WtVFLgTV", "roles", undefined);
      // ─────────────────────────────────────────────────────────────
      // 역할(Role) · 권한(Permission) — 공급자 무관 순수 로직(테스트 가능).
      //   "이 사람이 무엇을 할 수 있나"만 판정한다. 서버·DB·로그인 방식은 모른다.
      //
      //   3단 위계:  user(일반) < manager(매니저) < admin(운영자)
      //     · user    : 자기 계정 플레이·세이브
      //     · manager : 공지·이벤트·우편 발송, 문의 처리 (밸런스 변경 불가)
      //     · admin   : 밸런스 조정, 계정 제재, 재화 지급, 역할 부여 (전권)
      //
      //   ⚠ 클라이언트의 판정은 "화면 노출용"일 뿐이다. 실제 보안 경계는
      //      서버(Supabase RLS + 서버 검증)가 최종적으로 강제한다. (README_SUPABASE.md §4)
      // ─────────────────────────────────────────────────────────────

      // 역할 서열(숫자가 클수록 상위). 알 수 없는 값은 최하위로 취급.
      var ROLES = exports('ROLES', {
        user: 0,
        manager: 1,
        admin: 2
      });
      var ROLE_IDS = exports('ROLE_IDS', ['user', 'manager', 'admin']);
      var ROLE_LABEL = exports('ROLE_LABEL', {
        user: '일반',
        manager: '매니저',
        admin: '운영자'
      });
      var DEFAULT_ROLE = exports('DEFAULT_ROLE', 'user');

      // 권한(액션) → 요구되는 최소 역할.
      // 새 액션은 여기에 한 줄 추가하면 전 화면·서버가 같은 기준을 공유한다.
      var PERMISSIONS = exports('PERMISSIONS', {
        // ── 일반(user) ──
        play: 'user',
        // 게임 플레이
        cloudSave: 'user',
        // 클라우드 세이브
        editOwnAccount: 'user',
        // 자기 계정 설정

        // ── 매니저(manager) ──
        sendNotice: 'manager',
        // 공지 발송
        sendMail: 'manager',
        // 우편(재화 첨부 X) 발송
        manageEvent: 'manager',
        // 이벤트 켜기/끄기
        viewReports: 'manager',
        // 문의·신고 열람

        // ── 운영자(admin) ──
        tuneBalance: 'admin',
        // 밸런스 배수/배율 조정
        banAccount: 'admin',
        // 계정 제재
        grantCurrency: 'admin',
        // 재화 지급
        setRole: 'admin' // 다른 계정의 역할 부여
      });

      // 역할 문자열 → 서열 숫자(모르는 값은 -1 → 어떤 권한도 불충족).
      function roleRank(role) {
        return Object.prototype.hasOwnProperty.call(ROLES, role) ? ROLES[role] : -1;
      }

      // 유효한 역할 문자열인가.
      function isRole(role) {
        return Object.prototype.hasOwnProperty.call(ROLES, role);
      }

      // role이 need 이상인가. (예: atLeast('admin','manager') === true)
      function atLeast(role, need) {
        return roleRank(role) >= roleRank(need);
      }

      // role이 특정 액션을 수행할 수 있나. 미정의 액션은 안전하게 거부.
      function can(role, action) {
        var need = PERMISSIONS[action];
        if (need === undefined) return false;
        return atLeast(role, need);
      }

      // role이 수행 가능한 액션 목록(UI 게이팅·디버그용).
      function allowedActions(role) {
        return Object.keys(PERMISSIONS).filter(function (a) {
          return can(role, a);
        });
      }

      // 안전 정규화 — null/미상/잘못된 값은 기본 역할로.
      function normalizeRole(role) {
        return isRole(role) ? role : DEFAULT_ROLE;
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/rpg.ts", ['cc', './resolution.ts', './progression.ts', './gameState.ts', './economy.ts', './balance.ts'], function (exports) {
  var cclegacy, resolve, getStage, getPartyUnits, earn, accountMods;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      resolve = module.resolve;
    }, function (module) {
      getStage = module.getStage;
    }, function (module) {
      getPartyUnits = module.getPartyUnits;
    }, function (module) {
      earn = module.earn;
    }, function (module) {
      accountMods = module.accountMods;
    }],
    execute: function () {
      cclegacy._RF.push({}, "060caIQgNNCSpJIJDpfDofY", "rpg", undefined);

      // ─────────────────────────────────────────────────────────────
      // 장르 어댑터: RPG (능동형)
      // 플레이어가 직접 전투를 트리거한다. 행동력을 소모하고,
      // 승리해야만 다음 스테이지가 열린다. 시간은 플레이어가 굴린다.
      // ─────────────────────────────────────────────────────────────

      var rpgGenre = exports('rpgGenre', {
        id: 'rpg',
        name: 'RPG (능동)',
        ENERGY_COST: 6,
        // 현재 스테이지에 전투를 건다. 결과 로그를 반환.
        battle: function battle(state) {
          if (state.energy < this.ENERGY_COST) {
            return {
              ok: false,
              reason: '행동력 부족',
              energy: state.energy
            };
          }
          state.energy -= this.ENERGY_COST;
          var party = getPartyUnits(state);
          var stageDef = getStage(state.stage);
          var result = resolve(party, stageDef.challenge, accountMods(state), state.formation);
          if (result.win) {
            earn(state.wallet, {
              currency: stageDef.rewards.currency,
              growth: stageDef.rewards.growth
            });
            state.maxStage = Math.max(state.maxStage, state.stage + 1);
            state.stage += 1; // 다음 스테이지 개방
            return {
              ok: true,
              win: true,
              stage: stageDef.stage,
              reward: stageDef.rewards,
              log: result.log + " \u2192 \uC2A4\uD14C\uC774\uC9C0 " + state.stage + " \uAC1C\uBC29"
            };
          }
          return {
            ok: true,
            win: false,
            stage: stageDef.stage,
            log: result.log
          };
        },
        // 행동력 회복 (RPG 전용 자원 루프)
        restoreEnergy: function restoreEnergy(state, amount) {
          state.energy = Math.min(120, state.energy + amount);
        }
      });
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/run.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './progression.ts', './resolution.ts', './gameState.ts', './balance.ts', './economy.ts', './runBoons.ts'], function (exports) {
  var _extends, cclegacy, getStage, resolve, getPartyUnits, accountMods, earn, applyBoon, BOONS;
  return {
    setters: [function (module) {
      _extends = module.extends;
    }, function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      getStage = module.getStage;
    }, function (module) {
      resolve = module.resolve;
    }, function (module) {
      getPartyUnits = module.getPartyUnits;
    }, function (module) {
      accountMods = module.accountMods;
    }, function (module) {
      earn = module.earn;
    }, function (module) {
      applyBoon = module.applyBoon;
      BOONS = module.BOONS;
      exports('BOONS', module.BOONS);
    }],
    execute: function () {
      exports({
        buyUpgrade: buyUpgrade,
        currentNode: currentNode,
        endRun: endRun,
        expeditionMeta: expeditionMeta,
        fightNode: fightNode,
        pickBoon: pickBoon,
        startRun: startRun,
        upgradeCost: upgradeCost
      });
      cclegacy._RF.push({}, "c9801UAfXVAuLKEm8+zxMf8", "run", undefined);
      var RUN_NODES = exports('RUN_NODES', 10); // 한 런의 노드 수(전투 + 엘리트 + 보스)

      // ── 원정 메타(영구 진행) ─────────────────────────────────────
      // 토큰으로 사는 영구 업그레이드 — 모든 런에 적용. 층은 완주로 해금.
      var EXP_UPGRADES = exports('EXP_UPGRADES', {
        might: {
          label: '원정 전투력',
          desc: '레벨당 원정 전투력 +4%',
          max: 20,
          per: 0.04
        },
        vigor: {
          label: '강인함',
          desc: '레벨당 생명 소모 −3%',
          max: 15,
          per: 0.03
        },
        fortune: {
          label: '행운',
          desc: '레벨당 원정 보상 +8%',
          max: 15,
          per: 0.08
        }
      });

      // state.expedition 보장(구버전 세이브 대비) 후 반환.
      function expeditionMeta(state) {
        if (!state.expedition) state.expedition = {
          maxFloor: 1,
          tokens: 0,
          upgrades: {
            might: 0,
            vigor: 0,
            fortune: 0
          }
        };
        if (!state.expedition.upgrades) state.expedition.upgrades = {
          might: 0,
          vigor: 0,
          fortune: 0
        };
        return state.expedition;
      }
      function upgradeCost(level) {
        return 3 + level * 2;
      } // 3,5,7,… 토큰
      // 업그레이드 구매 — 토큰 차감·레벨 상승.
      function buyUpgrade(state, key) {
        var m = expeditionMeta(state);
        var u = EXP_UPGRADES[key];
        if (!u) return {
          ok: false,
          reason: '없는 업그레이드'
        };
        var lv = m.upgrades[key] || 0;
        if (lv >= u.max) return {
          ok: false,
          reason: '최대 레벨'
        };
        var cost = upgradeCost(lv);
        if (m.tokens < cost) return {
          ok: false,
          reason: '토큰 부족'
        };
        m.tokens -= cost;
        m.upgrades[key] = lv + 1;
        return {
          ok: true,
          key: key,
          level: lv + 1,
          tokens: m.tokens
        };
      }

      // 노드 i(0-based)의 종류·난이도. 마지막=보스, 중간(5)=엘리트, 나머지=일반.
      function nodeAt(floor, i) {
        var stage = (floor - 1) * 18 + (i + 1) * 4; // 층·진행에 따라 상승
        var base = getStage(stage);
        var isBoss = i === RUN_NODES - 1;
        var isElite = i === 5;
        var ch = _extends({}, base.challenge);
        var type = 'battle';
        if (isBoss) {
          type = 'boss';
          ch = {
            hp: Math.round(ch.hp * 2.2),
            atk: Math.round(ch.atk * 1.4),
            def: Math.round(ch.def * 1.2),
            element: ch.element
          };
        } else if (isElite) {
          type = 'elite';
          ch = {
            hp: Math.round(ch.hp * 1.5),
            atk: Math.round(ch.atk * 1.2),
            def: Math.round(ch.def * 1.1),
            element: ch.element
          };
        }
        return {
          type: type,
          stage: stage,
          challenge: ch,
          rewards: base.rewards
        };
      }

      // 승리 시 생명 소모량 — margin(여유)이 작을수록(아슬할수록) 크게 깎인다.
      function attritionCost(margin) {
        var c = 0.18 / Math.max(1, margin);
        return Math.min(0.18, Math.max(0.03, c));
      }

      // 런 시작 — 현재 편성을 스냅샷. 파티 없으면 실패.
      function startRun(state, _temp) {
        var _ref = _temp === void 0 ? {} : _temp,
          _ref$floor = _ref.floor,
          floor = _ref$floor === void 0 ? 1 : _ref$floor;
        if (state.run && state.run.status === 'active') return {
          ok: false,
          reason: '이미 진행 중인 원정이 있습니다'
        };
        if (!state.party || !state.party.length) return {
          ok: false,
          reason: '파티를 먼저 편성하세요'
        };
        var m = expeditionMeta(state);
        floor = Math.max(1, Math.min(floor, m.maxFloor)); // 해금된 층까지만
        var up = m.upgrades;
        var nodes = Array.from({
          length: RUN_NODES
        }, function (_, i) {
          return nodeAt(floor, i);
        });
        state.run = {
          floor: floor,
          nodes: nodes,
          idx: 0,
          // 클리어한 노드 수 = idx
          runHP: 1,
          // 생명 풀(0~1)
          boons: [],
          // 획득한 boon id
          powerMult: 1 * (1 + (up.might || 0) * EXP_UPGRADES.might.per),
          // 영구 업그레이드 반영
          attritionMult: 1 * (1 - (up.vigor || 0) * EXP_UPGRADES.vigor.per),
          // 강인함=소모↓
          regen: 0,
          // 관문마다 생명 회복량
          shield: 0,
          // 피해 무효 충전(승리 시 소모전 1회 무효)
          party: [].concat(state.party),
          formation: _extends({}, state.formation || {}),
          offer: null,
          // 현재 제시된 boon 3택(id 배열) 또는 null
          loot: {
            currency: 0,
            growth: 0
          },
          status: 'active'
        };
        return {
          ok: true,
          run: state.run
        };
      }
      function currentNode(state) {
        var r = state.run;
        if (!r || r.status !== 'active') return null;
        return r.nodes[r.idx] || null;
      }

      // 런에 참여한 파티 유닛 인스턴스(스냅샷 uid 기준).
      function runParty(state) {
        var ids = new Set(state.run.party);
        return getPartyUnits(state).filter(function (u) {
          return ids.has(u.uid);
        });
      }

      // 3택 boon 굴리기 — 서로 다른 3개(카탈로그가 3개 미만이면 있는 만큼).
      function rollBoons(rng) {
        var pool = BOONS.map(function (b) {
          return b.id;
        });
        var out = [];
        while (out.length < 3 && pool.length) {
          var k = Math.floor(rng() * pool.length);
          out.push(pool.splice(k, 1)[0]);
        }
        return out;
      }

      // 현재 노드 전투. 승리 시 생명 소모 + 전리품 누적 + (보스 아니면)보상 3택 제시.
      //   rng: 결정론 테스트용 난수(기본 Math.random).
      function fightNode(state, rng) {
        if (rng === void 0) {
          rng = Math.random;
        }
        var r = state.run;
        if (!r || r.status !== 'active') return {
          ok: false,
          reason: '진행 중인 원정이 없습니다'
        };
        if (r.offer) return {
          ok: false,
          reason: '보상을 먼저 선택하세요'
        };
        var node = r.nodes[r.idx];
        var party = runParty(state);
        if (!party.length) return {
          ok: false,
          reason: '파티 없음'
        };
        var mods = _extends({}, accountMods(state));
        mods.powerMult = (mods.powerMult || 1) * r.powerMult;
        var res = resolve(party, node.challenge, mods, r.formation);
        if (!res.win) {
          r.status = 'dead';
          return {
            ok: true,
            win: false,
            node: node,
            margin: res.margin,
            ended: true,
            status: r.status
          };
        }
        // 승리 — 전리품 누적 + 생명 소모(보호막 있으면 1회 무효) + 재생
        r.loot.currency += node.rewards.currency;
        r.loot.growth += node.rewards.growth;
        var cost = attritionCost(res.margin) * r.attritionMult;
        if (r.shield > 0) {
          r.shield -= 1;
          cost = 0;
        }
        r.runHP = Math.max(0, r.runHP - cost);
        if (r.runHP > 0) r.runHP = Math.min(1, r.runHP + r.regen); // 살아남으면 재생
        r.idx += 1;
        var offer = null;
        if (r.runHP <= 0) {
          r.status = 'dead'; // 소모전 탈진(마지막 노드는 클리어로 인정)
        } else if (r.idx >= r.nodes.length) {
          r.status = 'won'; // 보스까지 클리어
        } else {
          offer = rollBoons(rng); // 다음 전투 전 보상 3택
          r.offer = offer;
        }
        return {
          ok: true,
          win: true,
          node: node,
          margin: res.margin,
          runHP: r.runHP,
          offer: offer,
          ended: r.status !== 'active',
          status: r.status
        };
      }

      // 제시된 3택 중 하나 선택 → 적용(파워 누적 or 즉시 회복). offer 해제.
      function pickBoon(state, id) {
        var r = state.run;
        if (!r || r.status !== 'active') return {
          ok: false,
          reason: '진행 중인 원정이 없습니다'
        };
        if (!r.offer || !r.offer.includes(id)) return {
          ok: false,
          reason: '제시되지 않은 보상'
        };
        applyBoon(r, id);
        r.offer = null;
        return {
          ok: true,
          runHP: r.runHP,
          boons: [].concat(r.boons)
        };
      }

      // 런 종료 정산 — 클리어 노드 수 기반 메타 보상 + 전리품 지급, state.run 비움.
      //   진행 중(active)이면 포기로 간주(현재까지 보상). 반환: 정산 요약.
      function endRun(state) {
        var r = state.run;
        if (!r) return {
          ok: false,
          reason: '원정 없음'
        };
        var m = expeditionMeta(state);
        var cleared = r.idx;
        var won = r.status === 'won';
        var fortuneMult = 1 + (m.upgrades.fortune || 0) * EXP_UPGRADES.fortune.per;
        // 메타 토큰: 클리어 노드 + 완주 보너스, 행운 반영
        var tokens = Math.round((cleared + (won ? 5 : 0)) * fortuneMult);
        m.tokens += tokens;
        // 완주 시 다음 층 해금(현재 최고층 이상 완주해야)
        var unlocked = false;
        if (won && r.floor >= m.maxFloor) {
          m.maxFloor = r.floor + 1;
          unlocked = true;
        }
        var reward = _extends({}, r.loot, {
          gem: Math.round((cleared * 3 + (won ? 30 : 0)) * fortuneMult),
          summon: Math.round((cleared * 2 + (won ? 10 : 0)) * fortuneMult)
        });
        earn(state.wallet, reward);
        var summary = {
          cleared: cleared,
          won: won,
          floor: r.floor,
          boons: [].concat(r.boons),
          reward: reward,
          tokens: tokens,
          unlocked: unlocked,
          maxFloor: m.maxFloor
        };
        state.run = null;
        return _extends({
          ok: true
        }, summary);
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/runBoons.ts", ['cc'], function (exports) {
  var cclegacy;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }],
    execute: function () {
      exports('applyBoon', applyBoon);
      cclegacy._RF.push({}, "f604aDRM4NPpbepj5LNFBOa", "runBoons", undefined);
      // 원정 런 한정 강화(boon) 카탈로그 — 런 종료까지만 유지(영구 아님).
      //   필드: power(파워 배수) · heal(즉시 회복) · healDelta(즉시 감소) ·
      //        regen(관문마다 회복) · shield(피해 1회 무효 충전) · attritionMult(생명소모 배수)
      //   → 단순 강화뿐 아니라 리스크·보호·재생의 '선택 깊이'를 만든다.

      var BOONS = exports('BOONS', [{
        id: 'might',
        label: '전투력 +18%',
        icon: '⚔️',
        power: 1.18
      }, {
        id: 'surge',
        label: '전투력 +28%',
        icon: '⚔️',
        power: 1.28
      }, {
        id: 'berserk',
        label: '전투력 +45% · 생명소모↑',
        icon: '🔥',
        power: 1.45,
        attritionMult: 1.7
      }, {
        id: 'bulwark',
        label: '전투력 +12% · 생명소모↓',
        icon: '🛡️',
        power: 1.12,
        attritionMult: 0.72
      }, {
        id: 'mend',
        label: '생명 +35%',
        icon: '💖',
        heal: 0.35
      }, {
        id: 'vitality',
        label: '생명 +20% · 전투력 +8%',
        icon: '💗',
        heal: 0.20,
        power: 1.08
      }, {
        id: 'regen',
        label: '재생: 관문마다 생명 +8%',
        icon: '🌿',
        regen: 0.08
      }, {
        id: 'ward',
        label: '보호막: 피해 1회 무효',
        icon: '🔰',
        shield: 1
      }, {
        id: 'fortune',
        label: '전투력 +15% · 재생 +5%',
        icon: '🍀',
        power: 1.15,
        regen: 0.05
      }, {
        id: 'gambit',
        label: '생명 -15% · 전투력 +38%',
        icon: '🎲',
        power: 1.38,
        healDelta: -0.15
      }]);
      var BOON_BY_ID = exports('BOON_BY_ID', Object.fromEntries(BOONS.map(function (b) {
        return [b.id, b];
      })));

      // boon 하나를 런 상태에 적용(누적). runHP는 상한 1, 하한 0.05(즉사 방지).
      function applyBoon(run, id) {
        var b = BOON_BY_ID[id];
        if (!b) return false;
        run.boons.push(id);
        if (b.power) run.powerMult *= b.power;
        if (b.attritionMult) run.attritionMult *= b.attritionMult;
        if (b.regen) run.regen += b.regen;
        if (b.shield) run.shield += b.shield;
        if (b.heal) run.runHP = Math.min(1, run.runHP + b.heal);
        if (b.healDelta) run.runHP = Math.max(0.05, Math.min(1, run.runHP + b.healDelta));
        return true;
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/runes.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './economy.ts'], function (exports) {
  var _createForOfIteratorHelperLoose, cclegacy, spend;
  return {
    setters: [function (module) {
      _createForOfIteratorHelperLoose = module.createForOfIteratorHelperLoose;
    }, function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      spend = module.spend;
    }],
    execute: function () {
      exports({
        activeRuneSets: activeRuneSets,
        dropRune: dropRune,
        enhanceRune: enhanceRune,
        ensureRuneSeq: ensureRuneSeq,
        equipRune: equipRune,
        rerollRuneSubs: rerollRuneSubs,
        rollRuneSubs: rollRuneSubs,
        runeEnhanceCost: runeEnhanceCost,
        runeMainContribution: runeMainContribution,
        runeMainValue: runeMainValue,
        runeSetContribution: runeSetContribution,
        summonRune: summonRune,
        unequipRune: unequipRune
      });
      cclegacy._RF.push({}, "1b7fdjqH0NLpLjU10oblQYJ", "runes", undefined);

      // ─────────────────────────────────────────────────────────────
      // 룬 시스템 — 소켓형 서브스탯 수집층. 같은 캐릭터도 룬 세팅으로 빌드 분화.
      //   · 유닛당 룬 슬롯 3개. 각 룬 = 계열(set) + 메인스탯 + 레벨.
      //   · 같은 계열을 모으면 세트 보너스(2세트/3세트).
      //   · 발굴(summon)로 획득 → 룬 가방(state.runeBag)에 쌓이고, 슬롯에 장착.
      //   · 계정 유물(relics)과 다른 축: 룬은 "유닛별" 성장.
      // ─────────────────────────────────────────────────────────────

      var RUNE_SLOTS = exports('RUNE_SLOTS', 3);

      // 룬 계열 정의. main=슬롯 장착 시 메인스탯, set2/set3=세트 보너스.
      var RUNE_SETS = exports('RUNE_SETS', {
        RAGE: {
          id: 'RAGE',
          label: '분노',
          emoji: '🔥',
          main: {
            kind: 'statPct',
            stat: 'atk',
            base: 0.06
          },
          set2: {
            statPct: {
              atk: 0.10
            }
          },
          set3: {
            statPct: {
              atk: 0.15
            },
            effect: {
              critDamage: 0.3
            }
          }
        },
        GUARD: {
          id: 'GUARD',
          label: '수호',
          emoji: '🛡️',
          main: {
            kind: 'statPct',
            stat: 'hp',
            base: 0.06
          },
          set2: {
            statPct: {
              def: 0.12
            }
          },
          set3: {
            statPct: {
              hp: 0.15,
              def: 0.15
            }
          }
        },
        SWIFT: {
          id: 'SWIFT',
          label: '질풍',
          emoji: '💨',
          main: {
            kind: 'statPct',
            stat: 'spd',
            base: 0.08
          },
          set2: {
            statPct: {
              spd: 0.15
            }
          },
          set3: {
            statPct: {
              spd: 0.20,
              atk: 0.10
            }
          }
        },
        FATAL: {
          id: 'FATAL',
          label: '치명',
          emoji: '🎯',
          main: {
            kind: 'effect',
            stat: 'critChance',
            base: 0.04
          },
          set2: {
            effect: {
              critChance: 0.08
            }
          },
          set3: {
            effect: {
              critChance: 0.10,
              critDamage: 0.4
            }
          }
        },
        // ── Phase A 신규 계열 ──
        PIERCE: {
          id: 'PIERCE',
          label: '관통',
          emoji: '🏹',
          main: {
            kind: 'effect',
            stat: 'defPierce',
            base: 0.05
          },
          set2: {
            effect: {
              defPierce: 0.10
            }
          },
          set3: {
            effect: {
              defPierce: 0.15,
              critDamage: 0.2
            }
          }
        },
        MENDING: {
          id: 'MENDING',
          label: '치유',
          emoji: '🌿',
          main: {
            kind: 'effect',
            stat: 'lifesteal',
            base: 0.05
          },
          set2: {
            effect: {
              lifesteal: 0.10
            }
          },
          set3: {
            effect: {
              lifesteal: 0.14
            },
            statPct: {
              hp: 0.10
            }
          }
        }
      });

      // 룬 등급 — 메인스탯 배수 + 부옵션 개수. 발굴 확률로 결정.
      var RUNE_RARITY = exports('RUNE_RARITY', {
        N: {
          id: 'N',
          label: '일반',
          mult: 1.0,
          weight: 55,
          subs: 0
        },
        R: {
          id: 'R',
          label: '고급',
          mult: 1.5,
          weight: 32,
          subs: 1
        },
        SR: {
          id: 'SR',
          label: '희귀',
          mult: 2.2,
          weight: 13,
          subs: 1
        },
        SSR: {
          id: 'SSR',
          label: '영웅',
          mult: 3.0,
          weight: 5,
          subs: 2
        },
        UR: {
          id: 'UR',
          label: '신화',
          mult: 3.8,
          weight: 1,
          subs: 3
        }
      });

      // 룬 부옵션 풀 (장비보다 소폭).
      var RUNE_SUB_POOL = [{
        key: 'atk',
        kind: 'statPct',
        min: 0.03,
        max: 0.07
      }, {
        key: 'hp',
        kind: 'statPct',
        min: 0.03,
        max: 0.07
      }, {
        key: 'def',
        kind: 'statPct',
        min: 0.03,
        max: 0.07
      }, {
        key: 'spd',
        kind: 'statPct',
        min: 0.03,
        max: 0.07
      }, {
        key: 'critChance',
        kind: 'effect',
        min: 0.02,
        max: 0.05
      }, {
        key: 'critDamage',
        kind: 'effect',
        min: 0.05,
        max: 0.12
      }];
      function rollRuneSub(rng) {
        var p = RUNE_SUB_POOL[Math.floor(rng() * RUNE_SUB_POOL.length)];
        var v = p.min + rng() * (p.max - p.min);
        return {
          key: p.key,
          kind: p.kind,
          value: Math.round(v * 1000) / 1000
        };
      }
      function rollRuneSubs(rarity, rng) {
        var n = RUNE_RARITY[rarity] && RUNE_RARITY[rarity].subs || 0;
        var subs = [];
        var used = new Set();
        var guard = 0;
        while (subs.length < n && guard++ < 30) {
          var s = rollRuneSub(rng);
          if (used.has(s.key)) continue;
          used.add(s.key);
          subs.push(s);
        }
        return subs;
      }
      var RUNE_MAX_LEVEL = exports('RUNE_MAX_LEVEL', 5);
      var RUNE_SUMMON_COST = exports('RUNE_SUMMON_COST', {
        currency: 2000
      });
      var _rseq = 0;
      function ensureRuneSeq(n) {
        if (n > _rseq) _rseq = n;
      }
      var setIds = Object.keys(RUNE_SETS);
      function pickWeighted(rng, table, key) {
        var total = table.reduce(function (s, x) {
          return s + x[key];
        }, 0);
        var r = rng() * total;
        for (var _iterator = _createForOfIteratorHelperLoose(table), _step; !(_step = _iterator()).done;) {
          var x = _step.value;
          if ((r -= x[key]) <= 0) return x;
        }
        return table[table.length - 1];
      }

      // 룬 한 개 발굴 → 가방에 추가.
      function summonRune(state, rng) {
        if (rng === void 0) {
          rng = Math.random;
        }
        if (!spend(state.wallet, RUNE_SUMMON_COST)) return {
          ok: false,
          reason: '발굴 재화 부족',
          cost: RUNE_SUMMON_COST
        };
        state.runeBag = state.runeBag || [];
        state.runeBag.push(makeRune(rng));
        return {
          ok: true,
          rune: state.runeBag[state.runeBag.length - 1]
        };
      }

      // 룬 한 개 생성(등급 롤 + 부옵션). luck이 상위 등급 가중.
      function makeRune(rng, luck) {
        if (luck === void 0) {
          luck = 0;
        }
        var set = setIds[Math.floor(rng() * setIds.length)];
        var table = Object.values(RUNE_RARITY).map(function (r) {
          return {
            weight: r.weight * (r.id === 'UR' ? 1 + luck * 4 : r.id === 'SSR' ? 1 + luck * 2 : 1),
            id: r.id
          };
        });
        var rarity = pickWeighted(rng, table, 'weight').id;
        return {
          uid: "r" + ++_rseq,
          set: set,
          rarity: rarity,
          level: 0,
          subs: rollRuneSubs(rarity, rng)
        };
      }

      // 드롭 — 룬을 가방에 넣는다(룬 던전/환생 상자).
      function dropRune(state, rng, luck) {
        if (rng === void 0) {
          rng = Math.random;
        }
        if (luck === void 0) {
          luck = 0;
        }
        state.runeBag = state.runeBag || [];
        var rune = makeRune(rng, luck);
        state.runeBag.push(rune);
        return {
          ok: true,
          rune: rune,
          rarity: rune.rarity
        };
      }

      // 부옵션 재련 — 다이아 소모.
      function rerollRuneSubs(state, runeUid, rng) {
        if (rng === void 0) {
          rng = Math.random;
        }
        var rune = (state.runeBag || []).find(function (r) {
          return r.uid === runeUid;
        });
        if (!rune) {
          for (var _iterator2 = _createForOfIteratorHelperLoose(state.units), _step2; !(_step2 = _iterator2()).done;) {
            var u = _step2.value;
            var h = (u.runes || []).find(function (r) {
              return r && r.uid === runeUid;
            });
            if (h) {
              rune = h;
              break;
            }
          }
        }
        if (!rune) return {
          ok: false,
          reason: '룬 없음'
        };
        if (!(RUNE_RARITY[rune.rarity] && RUNE_RARITY[rune.rarity].subs)) return {
          ok: false,
          reason: '부옵션 없는 룬'
        };
        var cost = {
          gem: 15
        };
        if (!spend(state.wallet, cost)) return {
          ok: false,
          reason: '다이아 부족',
          cost: cost
        };
        rune.subs = rollRuneSubs(rune.rarity, rng);
        return {
          ok: true,
          subs: rune.subs,
          cost: cost
        };
      }

      // 룬 메인스탯 현재값 (등급 배수 × 레벨 성장).
      function runeMainValue(rune) {
        var set = RUNE_SETS[rune.set];
        var rar = RUNE_RARITY[rune.rarity] || RUNE_RARITY.N;
        return set.main.base * rar.mult * (1 + 0.25 * (rune.level || 0));
      }

      // 룬 강화 비용.
      function runeEnhanceCost(level) {
        return {
          currency: Math.round(500 * Math.pow(1.35, level))
        };
      }
      function findUnit(state, uid) {
        var u = state.units.find(function (x) {
          return x.uid === uid;
        });
        if (!u) throw new Error("\uC720\uB2DB \uC5C6\uC74C: " + uid);
        return u;
      }
      function findInBag(state, runeUid) {
        return (state.runeBag || []).findIndex(function (r) {
          return r.uid === runeUid;
        });
      }

      // 가방의 룬을 유닛 슬롯에 장착 (기존 룬은 가방으로 회수).
      function equipRune(state, uid, slot, runeUid) {
        var u = findUnit(state, uid);
        if (slot < 0 || slot >= RUNE_SLOTS) return {
          ok: false,
          reason: '잘못된 슬롯'
        };
        var idx = findInBag(state, runeUid);
        if (idx === -1) return {
          ok: false,
          reason: '가방에 없는 룬'
        };
        if (!u.runes) u.runes = new Array(RUNE_SLOTS).fill(null);
        var rune = state.runeBag[idx];
        state.runeBag.splice(idx, 1);
        var prev = u.runes[slot];
        if (prev) state.runeBag.push(prev);
        u.runes[slot] = rune;
        return {
          ok: true,
          slot: slot,
          equipped: rune.uid
        };
      }
      function unequipRune(state, uid, slot) {
        var u = findUnit(state, uid);
        var rune = u.runes && u.runes[slot];
        if (!rune) return {
          ok: false,
          reason: '빈 슬롯'
        };
        u.runes[slot] = null;
        state.runeBag = state.runeBag || [];
        state.runeBag.push(rune);
        return {
          ok: true,
          unequipped: rune.uid
        };
      }

      // 장착/가방 룬을 강화.
      function enhanceRune(state, runeUid) {
        var rune = (state.runeBag || []).find(function (r) {
          return r.uid === runeUid;
        });
        if (!rune) {
          for (var _iterator3 = _createForOfIteratorHelperLoose(state.units), _step3; !(_step3 = _iterator3()).done;) {
            var u = _step3.value;
            var hit = (u.runes || []).find(function (r) {
              return r && r.uid === runeUid;
            });
            if (hit) {
              rune = hit;
              break;
            }
          }
        }
        if (!rune) return {
          ok: false,
          reason: '룬 없음'
        };
        if (rune.level >= RUNE_MAX_LEVEL) return {
          ok: false,
          reason: "\uAC15\uD654 \uC0C1\uD55C " + RUNE_MAX_LEVEL
        };
        var cost = runeEnhanceCost(rune.level);
        if (!spend(state.wallet, cost)) return {
          ok: false,
          reason: '강화 재화 부족',
          cost: cost
        };
        rune.level += 1;
        return {
          ok: true,
          level: rune.level,
          cost: cost
        };
      }

      // ── 모디파이어 기여 (modifiers.mjs가 읽어 합산) ────────────────

      // 장착 룬 메인스탯 + 부옵션 합 → { statPct, effect }.
      function runeMainContribution(runes) {
        var statPct = {};
        var effect = {};
        for (var _iterator4 = _createForOfIteratorHelperLoose(runes || []), _step4; !(_step4 = _iterator4()).done;) {
          var r = _step4.value;
          if (!r) continue;
          var m = RUNE_SETS[r.set].main;
          var val = runeMainValue(r);
          if (m.kind === 'statPct') statPct[m.stat] = (statPct[m.stat] || 0) + val;else effect[m.stat] = (effect[m.stat] || 0) + val;
          // 부옵션 합산
          for (var _iterator5 = _createForOfIteratorHelperLoose(r.subs || []), _step5; !(_step5 = _iterator5()).done;) {
            var s = _step5.value;
            if (s.kind === 'statPct') statPct[s.key] = (statPct[s.key] || 0) + s.value;else effect[s.key] = (effect[s.key] || 0) + s.value;
          }
        }
        return {
          statPct: statPct,
          effect: effect
        };
      }

      // 세트 보너스 (같은 계열 2/3개) → { statPct, effect }.
      function runeSetContribution(runes) {
        var count = {};
        for (var _iterator6 = _createForOfIteratorHelperLoose(runes || []), _step6; !(_step6 = _iterator6()).done;) {
          var r = _step6.value;
          if (r) count[r.set] = (count[r.set] || 0) + 1;
        }
        var statPct = {};
        var effect = {};
        var merge = function merge(bonus) {
          if (!bonus) return;
          for (var _i = 0, _Object$entries = Object.entries(bonus.statPct || {}); _i < _Object$entries.length; _i++) {
            var _Object$entries$_i = _Object$entries[_i],
              k = _Object$entries$_i[0],
              v = _Object$entries$_i[1];
            statPct[k] = (statPct[k] || 0) + v;
          }
          for (var _i2 = 0, _Object$entries2 = Object.entries(bonus.effect || {}); _i2 < _Object$entries2.length; _i2++) {
            var _Object$entries2$_i = _Object$entries2[_i2],
              _k = _Object$entries2$_i[0],
              _v = _Object$entries2$_i[1];
            effect[_k] = (effect[_k] || 0) + _v;
          }
        };
        for (var _i3 = 0, _Object$entries3 = Object.entries(count); _i3 < _Object$entries3.length; _i3++) {
          var _Object$entries3$_i = _Object$entries3[_i3],
            set = _Object$entries3$_i[0],
            n = _Object$entries3$_i[1];
          var s = RUNE_SETS[set];
          if (n >= 2) merge(s.set2);
          if (n >= 3) merge(s.set3);
        }
        return {
          statPct: statPct,
          effect: effect
        };
      }

      // 활성 세트 요약 (UI 표시용): [{set,label,emoji,count,active2,active3}]
      function activeRuneSets(runes) {
        var count = {};
        for (var _iterator7 = _createForOfIteratorHelperLoose(runes || []), _step7; !(_step7 = _iterator7()).done;) {
          var r = _step7.value;
          if (r) count[r.set] = (count[r.set] || 0) + 1;
        }
        return Object.entries(count).map(function (_ref) {
          var set = _ref[0],
            n = _ref[1];
          return {
            set: set,
            label: RUNE_SETS[set].label,
            emoji: RUNE_SETS[set].emoji,
            count: n,
            active2: n >= 2,
            active3: n >= 3
          };
        });
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/save.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './units.ts', './gear.ts', './runes.ts', './mailbox.ts', './economy.ts', './gameState.ts'], function (exports) {
  var _extends, _createForOfIteratorHelperLoose, cclegacy, ensureUnitSeq, emptyGearSet, ensureGearSeq, ensureRuneSeq, ensureMailSeq, createWallet, MAX_PARTY;
  return {
    setters: [function (module) {
      _extends = module.extends;
      _createForOfIteratorHelperLoose = module.createForOfIteratorHelperLoose;
    }, function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      ensureUnitSeq = module.ensureUnitSeq;
    }, function (module) {
      emptyGearSet = module.emptyGearSet;
      ensureGearSeq = module.ensureGearSeq;
    }, function (module) {
      ensureRuneSeq = module.ensureRuneSeq;
    }, function (module) {
      ensureMailSeq = module.ensureMailSeq;
    }, function (module) {
      createWallet = module.createWallet;
    }, function (module) {
      MAX_PARTY = module.MAX_PARTY;
    }],
    execute: function () {
      exports({
        deserialize: deserialize,
        exportCode: exportCode,
        importCode: importCode,
        serialize: serialize
      });
      cclegacy._RF.push({}, "9f4b1wEclRHjIMez6aeSj1w", "save", undefined);

      // ─────────────────────────────────────────────────────────────
      // 세이브 직렬화 — gameState는 순수 데이터라 JSON으로 그대로 왕복 가능.
      // 로드 시 (1) 누락 필드 기본값 보정 (2) uid 시퀀스 동기화를 한다.
      // ─────────────────────────────────────────────────────────────

      var SAVE_VERSION = exports('SAVE_VERSION', 2);
      function serialize(state) {
        return JSON.stringify({
          v: SAVE_VERSION,
          ts: Date.now(),
          state: state
        });
      }

      // 누락/구버전 필드 보정 (안전한 로드).
      function normalize(state) {
        var _state$daily$claimedD, _state$arena$day, _state$guild$day, _state$energy;
        state.inventory = state.inventory || [];
        state.runeBag = state.runeBag || [];
        state.wallet = _extends({}, createWallet(), state.wallet || {});
        state.gacha = state.gacha || {
          pity: 0
        };
        state.relics = state.relics || {};
        state.emblems = state.emblems || {};
        state.guardians = state.guardians || {
          owned: {},
          active: []
        };
        state.guardians.owned = state.guardians.owned || {};
        state.guardians.active = state.guardians.active || [];
        state.pets = state.pets || {
          owned: {},
          active: []
        };
        state.pets.owned = state.pets.owned || {};
        state.pets.active = state.pets.active || [];
        state.pets.opts = state.pets.opts || {};
        state.daily = state.daily || {};
        state.daily.epochDay = state.daily.epochDay || 0;
        state.daily.streak = state.daily.streak || 0;
        state.daily.claimedDay = (_state$daily$claimedD = state.daily.claimedDay) != null ? _state$daily$claimedD : -1;
        state.daily.missions = state.daily.missions || {
          summon: 0,
          upgrade: 0,
          dungeon: 0
        };
        state.daily.claimed = state.daily.claimed || {};
        state.daily.dungeon = state.daily.dungeon || {
          GOLD: 0,
          ESSENCE: 0
        };
        state.daily.ads = state.daily.ads || {};
        state.shop = state.shop || {
          purchased: {}
        };
        state.shop.purchased = state.shop.purchased || {};
        state.rentals = state.rentals || {};
        state.admin = state.admin || {
          overrides: {}
        };
        state.admin.overrides = state.admin.overrides || {};
        state.materials = state.materials || {};
        // 돌파석 폐지 마이그레이션: 구버전 세이브에 남은 돌파석을 소환석으로 1:1 환급 후 제거.
        if (state.materials.ascendStone) {
          state.wallet.summon = (state.wallet.summon || 0) + state.materials.ascendStone;
          delete state.materials.ascendStone;
        }
        state.materials.elemEssence = state.materials.elemEssence || 0;
        state.materials.petShard = state.materials.petShard || {};
        for (var _i = 0, _arr = ['R', 'SR', 'SSR', 'UR']; _i < _arr.length; _i++) {
          var gr = _arr[_i];
          state.materials.petShard[gr] = state.materials.petShard[gr] || 0;
        }
        state.arena = state.arena || {
          points: 0,
          day: -1,
          entries: 0
        };
        state.arena.points = state.arena.points || 0;
        state.arena.day = (_state$arena$day = state.arena.day) != null ? _state$arena$day : -1;
        state.arena.entries = state.arena.entries || 0;
        state.ladders = state.ladders || {};
        state.mail = Array.isArray(state.mail) ? state.mail : [];
        state.guild = state.guild || {
          coins: 0,
          day: -1,
          attacks: 0,
          tier: 1,
          bossHp: null
        };
        state.guild.coins = state.guild.coins || 0;
        state.guild.day = (_state$guild$day = state.guild.day) != null ? _state$guild$day : -1;
        state.guild.attacks = state.guild.attacks || 0;
        state.guild.tier = state.guild.tier || 1;
        if (state.guild.bossHp === undefined) state.guild.bossHp = null;
        state.meta = state.meta || {};
        state.meta.achv = state.meta.achv || {};
        state.meta.coll = state.meta.coll || {};
        state.meta.season = state.meta.season || {
          claimed: {},
          premium: false
        };
        state.meta.season.claimed = state.meta.season.claimed || {};
        state.meta.season.premium = !!state.meta.season.premium;
        state.campaign = state.campaign || {
          cleared: 0
        };
        state.campaign.cleared = state.campaign.cleared || 0;
        state.tutorial = state.tutorial || {
          introSeen: false
        };
        state.tutorial.introSeen = !!state.tutorial.introSeen;
        state.settings = state.settings || {};
        state.settings.muted = !!state.settings.muted;
        state.settings.haptics = state.settings.haptics !== false; // 기본 on
        state.settings.reduceMotion = !!state.settings.reduceMotion;
        state.settings.skipGachaAnim = !!state.settings.skipGachaAnim; // 가챠 연출 스킵(기본 off)
        state.settings.ecoMode = !!state.settings.ecoMode; // 절전 모드(발열/배터리, 기본 off)
        state.settings.lang = state.settings.lang || 'ko';
        // 낮은 등급 장비 자동 분해 임계: null(끄기) | 'N' | 'R'. 기본 끄기.
        if (state.settings.autoSalvage === undefined) state.settings.autoSalvage = null;
        state.tower = state.tower || {
          floor: 1,
          best: 1
        };
        state.tower.floor = state.tower.floor || 1;
        state.tower.best = state.tower.best || state.tower.floor || 1;
        state.profile = state.profile || {};
        state.profile.name = state.profile.name || '조련사';
        if (state.profile.avatarUid === undefined) state.profile.avatarUid = null;
        state.profile.frame = state.profile.frame || 'none';
        state.profile.title = state.profile.title || 'none';
        state.profile.premium = !!state.profile.premium;
        state.profile.owned = state.profile.owned || {};
        state.profile.owned.frame = state.profile.owned.frame || {};
        state.profile.owned.title = state.profile.owned.title || {};
        state.summonMastery = state.summonMastery || {};
        for (var _i2 = 0, _arr2 = ['hero', 'pet', 'gear', 'rune', 'cosmetic']; _i2 < _arr2.length; _i2++) {
          var bn = _arr2[_i2];
          var m = state.summonMastery[bn] || {};
          state.summonMastery[bn] = {
            count: m.count || 0,
            claimed: m.claimed || 0
          };
        }
        state.costumes = state.costumes || {
          owned: {}
        };
        state.costumes.owned = state.costumes.owned || {};
        state.vip = state.vip || {
          spend: 0
        };
        state.vip.spend = state.vip.spend || 0;
        // 주간 테마 이벤트(미니 로드맵) 진행 상태.
        state.events = state.events || {
          week: -1,
          progress: 0,
          claimed: false
        };
        state.events.progress = state.events.progress || 0;
        // 시즌 소프트리셋 던전 진행(평준화 랭킹).
        state.season2 = state.season2 || {
          idx: -1,
          floor: 0,
          best: 0
        };
        state.season2.floor = state.season2.floor || 0;
        state.season2.best = state.season2.best || 0;
        state.stage = state.stage || 1;
        state.difficulty = state.difficulty || 'normal';
        state.maxStage = state.maxStage || 1;
        state.peakStage = state.peakStage || state.maxStage || 1;
        state.energy = (_state$energy = state.energy) != null ? _state$energy : 60;
        state.prestige = state.prestige || 0;
        state.party = state.party || [];
        // 파티가 비었거나 보유하지 않은 uid만 남았다면 최소 1명 보정.
        var owned = new Set((state.units || []).map(function (u) {
          return u.uid;
        }));
        state.party = state.party.filter(function (uid) {
          return owned.has(uid);
        });
        // 편성 정원 축소(7→5) 마이그레이션 — 기존 세이브의 초과 인원을 잘라낸다.
        if (state.party.length > MAX_PARTY) state.party = state.party.slice(0, MAX_PARTY);
        if (state.party.length === 0 && state.units && state.units.length) {
          state.party = [state.units[0].uid];
        }
        // 진형: 편성된 유닛만 후열 지정 유지 (미편성 uid 정리).
        state.formation = state.formation || {};
        for (var _i3 = 0, _Object$keys = Object.keys(state.formation); _i3 < _Object$keys.length; _i3++) {
          var uid = _Object$keys[_i3];
          if (!state.party.includes(uid)) delete state.formation[uid];
        }
        state.formationPresets = state.formationPresets || {};
        for (var _iterator = _createForOfIteratorHelperLoose(state.units || []), _step; !(_step = _iterator()).done;) {
          var u = _step.value;
          if (!u.skills) u.skills = [null, null, null];
          if (!u.enhance) u.enhance = {
            atk: 0,
            hp: 0,
            def: 0,
            crit: 0
          };
          // 장비: 전 슬롯 보장(신규 슬롯 backfill). 기존 장착품은 유지.
          u.gear = _extends({}, emptyGearSet(), u.gear || {});
          if (u.characterId === undefined) u.characterId = null;
          if (u.signature === undefined) u.signature = null;
          if (u.element === undefined) u.element = null;
          if (u.intimacy === undefined) u.intimacy = 0;
          if (u.costume === undefined) u.costume = null;
          if (!u.costumeBonus) u.costumeBonus = {};
          if (u.skin === undefined) u.skin = null;
          if (!u.sigWeapon) u.sigWeapon = {
            level: 0
          };
          if (u.sigAwaken === undefined) u.sigAwaken = 0;
          if (!u.runes) u.runes = [null, null, null];
          if (!u.star || u.star < 1) u.star = 1; // 성급 기본 1(구버전 세이브 보정)
        }

        return state;
      }

      // uid("u12"/"g3")를 스캔해 시퀀스를 끌어올린다 → 로드 후 신규 생성 충돌 방지.
      function syncSeq(state) {
        var maxU = 0,
          maxG = 0,
          maxR = 0;
        var num = function num(id, pfx) {
          return parseInt(String(id || '').replace(pfx, ''), 10) || 0;
        };
        for (var _iterator2 = _createForOfIteratorHelperLoose(state.units || []), _step2; !(_step2 = _iterator2()).done;) {
          var u = _step2.value;
          maxU = Math.max(maxU, num(u.uid, 'u'));
          for (var _i4 = 0, _Object$keys2 = Object.keys(u.gear || {}); _i4 < _Object$keys2.length; _i4++) {
            var slot = _Object$keys2[_i4];
            var it = u.gear[slot];
            if (it) maxG = Math.max(maxG, num(it.uid, 'g'));
          }
          for (var _iterator6 = _createForOfIteratorHelperLoose(u.runes || []), _step6; !(_step6 = _iterator6()).done;) {
            var r = _step6.value;
            if (r) maxR = Math.max(maxR, num(r.uid, 'r'));
          }
        }
        for (var _iterator3 = _createForOfIteratorHelperLoose(state.inventory || []), _step3; !(_step3 = _iterator3()).done;) {
          var _it = _step3.value;
          maxG = Math.max(maxG, num(_it.uid, 'g'));
        }
        for (var _iterator4 = _createForOfIteratorHelperLoose(state.runeBag || []), _step4; !(_step4 = _iterator4()).done;) {
          var _r = _step4.value;
          maxR = Math.max(maxR, num(_r.uid, 'r'));
        }
        var maxM = 0;
        for (var _iterator5 = _createForOfIteratorHelperLoose(state.mail || []), _step5; !(_step5 = _iterator5()).done;) {
          var m = _step5.value;
          maxM = Math.max(maxM, num(m.id, 'm'));
        }
        ensureUnitSeq(maxU);
        ensureGearSeq(maxG);
        ensureRuneSeq(maxR);
        ensureMailSeq(maxM);
      }

      // json → state (실패/버전불일치 시 null).
      function deserialize(json) {
        var obj;
        try {
          obj = JSON.parse(json);
        } catch (_unused) {
          return null;
        }
        if (!obj || obj.v !== SAVE_VERSION || !obj.state) return null;
        var state = normalize(obj.state);
        syncSeq(state);
        return state;
      }

      // ─── 세이브 이관 코드 ────────────────────────────────────────
      // 백엔드 없이 기기·계정 간 진행을 옮기는 휴대용 코드.
      //   내보내기: 현재 세이브 → "ELD1:<base64>" 문자열(클립보드 공유)
      //   불러오기: 그 코드 → state (검증 실패 시 null)
      // UTF-8 안전 base64 (한글 캐릭터명 포함).
      var CODE_PREFIX = 'ELD1:';
      function toB64(s) {
        if (typeof Buffer !== 'undefined') return Buffer.from(s, 'utf8').toString('base64');
        var bytes = new TextEncoder().encode(s);
        var bin = '';
        bytes.forEach(function (b) {
          return bin += String.fromCharCode(b);
        });
        return btoa(bin);
      }
      function fromB64(b) {
        if (typeof Buffer !== 'undefined') return Buffer.from(b, 'base64').toString('utf8');
        var bin = atob(b);
        var bytes = Uint8Array.from(bin, function (c) {
          return c.charCodeAt(0);
        });
        return new TextDecoder().decode(bytes);
      }
      function exportCode(state) {
        return CODE_PREFIX + toB64(serialize(state));
      }
      function importCode(code) {
        if (typeof code !== 'string') return null;
        var trimmed = code.trim();
        if (!trimmed.startsWith(CODE_PREFIX)) return null;
        var json;
        try {
          json = fromB64(trimmed.slice(CODE_PREFIX.length));
        } catch (_unused2) {
          return null;
        }
        return deserialize(json);
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/scifi.ts", ['cc'], function (exports) {
  var cclegacy;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }],
    execute: function () {
      cclegacy._RF.push({}, "bdacfIltI9IPJKTxAsv6lhY", "scifi", undefined);
      // ─────────────────────────────────────────────────────────────
      // 컨셉 스킨: SF
      // fantasy.mjs 와 "완전히 같은 구조". 이름만 다르다.
      // → 같은 시스템이 전혀 다른 게임처럼 보이는 이유가 여기 있다.
      // ─────────────────────────────────────────────────────────────

      var scifiConcept = exports('scifiConcept', {
        id: 'scifi',
        title: '오비탈 프로토콜',
        palette: {
          primary: '#1fb6c9',
          accent: '#ff6b3d'
        },
        archetypes: {
          VANGUARD: {
            name: '가디언 프레임',
            emoji: '🤖'
          },
          STRIKER: {
            name: '레이저 유닛',
            emoji: '🔫'
          },
          SUPPORT: {
            name: '지원 드론',
            emoji: '🛰️'
          },
          ROGUE: {
            name: '스텔스 유닛',
            emoji: '🕶️'
          },
          ARCHER: {
            name: '저격 유닛',
            emoji: '🎯'
          },
          MAGE: {
            name: '플라즈마 코어',
            emoji: '🌌'
          }
        },
        resources: {
          currency: {
            name: '크레딧',
            emoji: '💳'
          },
          growth: {
            name: '코어',
            emoji: '🔋'
          },
          summon: {
            name: '설계도',
            emoji: '📡'
          },
          gem: {
            name: '퀀텀',
            emoji: '💎'
          }
        },
        terms: {
          unit: '기체',
          party: '편대',
          stage: '섹터',
          energy: '연료'
        },
        // 속성 ID(Core) → SF 표시명. fantasy와 "같은 ID, 다른 이름".
        elements: {
          FIRE: {
            name: '열',
            emoji: '🔥'
          },
          WATER: {
            name: '냉각',
            emoji: '❄️'
          },
          WOOD: {
            name: '바람',
            emoji: '🌪️'
          },
          LIGHT: {
            name: '광자',
            emoji: '✨'
          },
          DARK: {
            name: '중력',
            emoji: '🌀'
          }
        },
        // 도감 — fantasy와 "완전히 같은 mechanical 구조"(archetype/rarity/signature/element 동일),
        // 이름/외형만 SF로. 같은 시스템·같은 캐릭터 슬롯, 다른 인물.
        roster: [{
          id: 'kael',
          name: '유닛-07',
          emoji: '🔥',
          title: '화염 프레임',
          personality: '공격적인',
          element: 'FIRE',
          archetype: 'STRIKER',
          rarity: 'SSR',
          signature: 'SIG_FLAME_EDGE',
          lines: {
            greet: '타겟 확인. 발열 개시.',
            bond: '동기화율 최대치 도달.',
            levelup: '출력 상승.'
          }
        }, {
          id: 'luna',
          name: '노바',
          emoji: '🌙',
          title: '지원 코어',
          personality: '침착한',
          element: 'LIGHT',
          archetype: 'SUPPORT',
          rarity: 'SSR',
          signature: 'SIG_MOON_BLESSING',
          lines: {
            greet: '전 시스템 정상.',
            bond: '링크가 안정적입니다.',
            levelup: '코어 강화됨.'
          }
        }, {
          id: 'gwen',
          name: '크라이오',
          emoji: '❄️',
          title: '냉각 가디언',
          personality: '과묵한',
          element: 'WATER',
          archetype: 'VANGUARD',
          rarity: 'SR',
          signature: 'SIG_FROST_GUARD',
          lines: {
            greet: '…대기 중.',
            bond: '신뢰도 상승.',
            levelup: '장갑 강화.'
          }
        }, {
          id: 'ciel',
          name: '제트',
          emoji: '🌪️',
          title: '고속 유닛',
          personality: '경쾌한',
          element: 'WOOD',
          archetype: 'STRIKER',
          rarity: 'SR',
          signature: 'SIG_WIND_DANCE',
          lines: {
            greet: '부스터 예열 완료~',
            bond: '너랑 비행하면 최고!',
            levelup: '속도 초과 달성!'
          }
        }, {
          id: 'bran',
          name: '불워크',
          emoji: '🪨',
          title: '중장 프레임',
          personality: '견고한',
          element: 'WOOD',
          archetype: 'VANGUARD',
          rarity: 'R',
          signature: 'SIG_EARTH_AEGIS',
          lines: {
            greet: '방어선 구축.',
            bond: '보호 대상으로 등록됨.',
            levelup: '장갑 증설 완료.'
          }
        }, {
          id: 'ael',
          name: '오라클',
          emoji: '🕊️',
          title: '예측 AI',
          personality: '분석적인',
          element: 'LIGHT',
          archetype: 'SUPPORT',
          rarity: 'R',
          signature: 'SIG_LIGHT_ORACLE',
          lines: {
            greet: '확률 계산 중…',
            bond: '예측 정확도 상승.',
            levelup: '연산 능력 강화.'
          }
        }, {
          id: 'ara',
          name: '스톰',
          emoji: '⚡',
          title: '방전 유닛',
          personality: '난폭한',
          element: 'DARK',
          archetype: 'STRIKER',
          rarity: 'R',
          signature: 'SIG_STORM_BLADE',
          lines: {
            greet: '방전 준비.',
            bond: '…쓸만하군.',
            levelup: '전압 상승!'
          }
        }, {
          id: 'mir',
          name: '루키',
          emoji: '🗡️',
          title: '시제기',
          personality: '미숙한',
          element: 'WOOD',
          archetype: 'STRIKER',
          rarity: 'N',
          signature: 'SIG_NOVICE',
          lines: {
            greet: '시운전 시작합니다!',
            bond: '정식 배치 부탁해요!',
            levelup: '성능 향상 확인!'
          }
        },
        // ── P1 신규: 속성×원형 공백 보강 ──
        {
          id: 'pyra',
          name: '파이로',
          emoji: '🛡️',
          title: '화염 방벽 프레임',
          personality: '견고한',
          element: 'FIRE',
          archetype: 'VANGUARD',
          rarity: 'SR',
          signature: 'SIG_EMBER_WALL',
          lines: {
            greet: '방열 장갑 전개.',
            bond: '보호 프로토콜 우선.',
            levelup: '장갑 출력 상승.'
          }
        }, {
          id: 'frost',
          name: '글레이셔',
          emoji: '🧊',
          title: '빙결 어쌔신',
          personality: '냉철한',
          element: 'WATER',
          archetype: 'STRIKER',
          rarity: 'SR',
          signature: 'SIG_GLACIER_EDGE',
          lines: {
            greet: '…절단 예정.',
            bond: '너는 대상에서 제외.',
            levelup: '블레이드 예리화.'
          }
        }, {
          id: 'marina',
          name: '티데',
          emoji: '🌊',
          title: '수복 드로이드',
          personality: '차분한',
          element: 'WATER',
          archetype: 'SUPPORT',
          rarity: 'SR',
          signature: 'SIG_TIDE_HYMN',
          lines: {
            greet: '손상 스캔 개시.',
            bond: '링크 안정도 최적.',
            levelup: '수복 효율 상승.'
          }
        }, {
          id: 'signe',
          name: '클래리온',
          emoji: '📯',
          title: '전술 지휘 유닛',
          personality: '결연한',
          element: 'FIRE',
          archetype: 'SUPPORT',
          rarity: 'R',
          signature: 'SIG_WAR_CHANT',
          lines: {
            greet: '전술 링크 개방.',
            bond: '지휘 동기화 완료.',
            levelup: '지휘 대역 확장.'
          }
        },
        // ── P3 신화(UR) ──
        {
          id: 'aurel',
          name: '오리온',
          emoji: '🌟',
          title: '여명 프로토타입',
          personality: '숭고한',
          element: 'LIGHT',
          archetype: 'STRIKER',
          rarity: 'UR',
          signature: 'SIG_DAWNBREAKER',
          lines: {
            greet: '여명 시퀀스 개시.',
            bond: '수호 대상 최우선 등록.',
            levelup: '광자 출력 초월.'
          }
        }, {
          id: 'nyx',
          name: '아뷔스',
          emoji: '🔮',
          title: '심연 예측 코어',
          personality: '초월적인',
          element: 'DARK',
          archetype: 'SUPPORT',
          rarity: 'UR',
          signature: 'SIG_ABYSS_ORACLE',
          lines: {
            greet: '심연 연산 접속.',
            bond: '네 궤적, 상시 추적.',
            levelup: '예측 심도 확장.'
          }
        },
        // ── 신규 원형: 스텔스·저격·플라즈마 코어 ──
        {
          id: 'kai',
          name: '고스트-0',
          emoji: '🕶️',
          title: '시제 정찰 유닛',
          personality: '은밀한',
          element: 'WOOD',
          archetype: 'ROGUE',
          rarity: 'N',
          signature: 'SIG_ROGUE_NOVICE',
          lines: {
            greet: '광학 위장 가동.',
            bond: '너한텐 신호 안 숨겨.',
            levelup: '반응속도 향상.'
          }
        }, {
          id: 'vera',
          name: '쉐도우',
          emoji: '🔪',
          title: '암전 암살 유닛',
          personality: '냉혹한',
          element: 'DARK',
          archetype: 'ROGUE',
          rarity: 'SSR',
          signature: 'SIG_NIGHT_FANG',
          lines: {
            greet: '표적, 락온 완료.',
            bond: '…너만은 조준선 밖이다.',
            levelup: '더 어두운 침묵이 된다.'
          }
        }, {
          id: 'robin',
          name: '스나이퍼-R',
          emoji: '🎯',
          title: '삼림 저격 유닛',
          personality: '차분한',
          element: 'WOOD',
          archetype: 'ARCHER',
          rarity: 'R',
          signature: 'SIG_FOREST_ARROW',
          lines: {
            greet: '풍향 계산 완료.',
            bond: '탄도, 너와는 공유하지.',
            levelup: '조준 정밀도 상승.'
          }
        }, {
          id: 'sylas',
          name: '포톤',
          emoji: '💫',
          title: '광자 저격수',
          personality: '고요한',
          element: 'LIGHT',
          archetype: 'ARCHER',
          rarity: 'SSR',
          signature: 'SIG_LIGHT_ARROW',
          lines: {
            greet: '광속 탄도, 오차 없음.',
            bond: '네 곁에서 조준을 고정한다.',
            levelup: '탄두에 빛이 실린다.'
          }
        }, {
          id: 'elara',
          name: '이그니션',
          emoji: '🕯️',
          title: '플라즈마 캐스터',
          personality: '열정적인',
          element: 'FIRE',
          archetype: 'MAGE',
          rarity: 'R',
          signature: 'SIG_INFERNO_BOLT',
          lines: {
            greet: '플라즈마 출력 최대.',
            bond: '네 곁이라 더 뜨거워져요.',
            levelup: '코어가 타오릅니다!'
          }
        }, {
          id: 'oriel',
          name: '싱귤래러티',
          emoji: '🌀',
          title: '특이점 코어',
          personality: '초연한',
          element: 'DARK',
          archetype: 'MAGE',
          rarity: 'UR',
          signature: 'SIG_CHAOS_NOVA',
          lines: {
            greet: '특이점이 호출에 응한다.',
            bond: '너만은 이 붕괴 밖에 둔다.',
            levelup: '봉인 프로토콜 하나 해제.'
          }
        },
        // ── 원형별 등급 공백 보강(N/R/SR/SSR/UR 전 등급 커버) ──
        {
          id: 'toren',
          name: '유닛-T0',
          emoji: '🔰',
          title: '시제 방어 프레임',
          personality: '미숙한',
          element: 'WOOD',
          archetype: 'VANGUARD',
          rarity: 'N',
          signature: 'SIG_VANGUARD_NOVICE',
          lines: {
            greet: '방어막, 아직 불안정합니다.',
            bond: '보호 대상으로 등록할게요!',
            levelup: '장갑 강도가 조금 올랐어요.'
          }
        }, {
          id: 'kordan',
          name: '볼케이노',
          emoji: '🌋',
          title: '용암 장갑 프레임',
          personality: '불굴의',
          element: 'FIRE',
          archetype: 'VANGUARD',
          rarity: 'SSR',
          signature: 'SIG_FLAME_BASTION',
          lines: {
            greet: '이 장갑은 뚫리지 않는다.',
            bond: '내 열차폐 뒤에서 안전하다.',
            levelup: '용암 코어 출력 상승.'
          }
        }, {
          id: 'ymir',
          name: '글레이셔 프라임',
          emoji: '🏔️',
          title: '고대 방어 코어',
          personality: '태고의',
          element: 'WATER',
          archetype: 'VANGUARD',
          rarity: 'UR',
          signature: 'SIG_GLACIAL_TITAN',
          lines: {
            greet: '고대 코어가 재가동된다.',
            bond: '너를 위해 산이 되어주마.',
            levelup: '방어 필드가 두꺼워진다.'
          }
        }, {
          id: 'nella',
          name: '노비스',
          emoji: '🌸',
          title: '견습 치유 드론',
          personality: '순수한',
          element: 'LIGHT',
          archetype: 'SUPPORT',
          rarity: 'N',
          signature: 'SIG_SUPPORT_NOVICE',
          lines: {
            greet: '치유 신호, 송신 중…',
            bond: '당신을 위해 대기할게요.',
            levelup: '출력이 조금씩 늘어요.'
          }
        }, {
          id: 'jax',
          name: '스트리트',
          emoji: '🥋',
          title: '뒷골목 개조 유닛',
          personality: '거친',
          element: 'FIRE',
          archetype: 'ROGUE',
          rarity: 'R',
          signature: 'SIG_ALLEY_BLADE',
          lines: {
            greet: '조용히 처리하지.',
            bond: '너랑은 등을 맡겨도 되겠어.',
            levelup: '블레이드가 더 매서워졌다.'
          }
        }, {
          id: 'mira',
          name: '미스트',
          emoji: '🌫️',
          title: '연막 자객 유닛',
          personality: '은밀한',
          element: 'WATER',
          archetype: 'ROGUE',
          rarity: 'SR',
          signature: 'SIG_MIST_STRIKE',
          lines: {
            greet: '연막, 전개.',
            bond: '너에게만 신호를 남기지.',
            levelup: '은신 성능이 향상됐다.'
          }
        }, {
          id: 'raven',
          name: '레이븐-X',
          emoji: '🌑',
          title: '심연 그림자 유닛',
          personality: '무자비한',
          element: 'DARK',
          archetype: 'ROGUE',
          rarity: 'UR',
          signature: 'SIG_ABYSS_SHADOW',
          lines: {
            greet: '그림자에 식별명은 없다.',
            bond: '…너만은 조준선 밖이군.',
            levelup: '스텔스 필드가 깊어졌다.'
          }
        }, {
          id: 'finn',
          name: '루키-F',
          emoji: '🍂',
          title: '견습 추적 유닛',
          personality: '순박한',
          element: 'WOOD',
          archetype: 'ARCHER',
          rarity: 'N',
          signature: 'SIG_ARCHER_NOVICE',
          lines: {
            greet: '조준 시스템, 가동!',
            bond: '같이 출격해요!',
            levelup: '반동 제어가 안정됐어요!'
          }
        }, {
          id: 'lyra',
          name: '루나틱',
          emoji: '🌜',
          title: '월광 저격 유닛',
          personality: '냉철한',
          element: 'LIGHT',
          archetype: 'ARCHER',
          rarity: 'SR',
          signature: 'SIG_MOONLIGHT_SHOT',
          lines: {
            greet: '야간 조준, 오차 없음.',
            bond: '너에게만 안전거리를 준다.',
            levelup: '조준 알고리즘 개선.'
          }
        }, {
          id: 'seren',
          name: '스카이호크',
          emoji: '🦅',
          title: '천공 저격 유닛',
          personality: '고고한',
          element: 'FIRE',
          archetype: 'ARCHER',
          rarity: 'UR',
          signature: 'SIG_CELESTIAL_ARROW',
          lines: {
            greet: '대기권까지 관통한다.',
            bond: '네 곁에서만 조준을 내린다.',
            levelup: '탄두가 태양처럼 타오른다.'
          }
        }, {
          id: 'pip',
          name: '스파크',
          emoji: '📗',
          title: '견습 연산 유닛',
          personality: '호기심 많은',
          element: 'WOOD',
          archetype: 'MAGE',
          rarity: 'N',
          signature: 'SIG_MAGE_NOVICE',
          lines: {
            greet: '이 알고리즘, 작동할까요?',
            bond: '같이 연산 돌려봐요!',
            levelup: '오, 이번엔 안 터졌어요!'
          }
        }, {
          id: 'thalia',
          name: '크라이오제닉',
          emoji: '🌬️',
          title: '냉각 코어 유닛',
          personality: '차가운',
          element: 'WATER',
          archetype: 'MAGE',
          rarity: 'SR',
          signature: 'SIG_FROST_NOVA',
          lines: {
            greet: '…냉각 준비는 됐나.',
            bond: '너에게만 열원을 남기지.',
            levelup: '냉각 출력이 짙어진다.'
          }
        }, {
          id: 'nocturne',
          name: '녹턴 코어',
          emoji: '🌘',
          title: '심연 연산 코어',
          personality: '신비로운',
          element: 'DARK',
          archetype: 'MAGE',
          rarity: 'SSR',
          signature: 'SIG_VOID_SURGE',
          lines: {
            greet: '봉인된 연산이 속삭인다.',
            bond: '네게만 금지 데이터를 연다.',
            levelup: '봉인된 연산이 흘러든다.'
          }
        }],
        // 코스튬 — fantasy와 같은 구조(같은 캐릭터 id·해금·보너스), SF 외형.
        costumes: {
          kael: {
            id: 'kael_c1',
            name: '강화 프레임',
            emoji: '🦾',
            unlock: 5,
            bonus: {
              atk: 0.06,
              hp: 0.06,
              def: 0.06,
              spd: 0.06
            }
          },
          luna: {
            id: 'luna_c1',
            name: '정밀 코어',
            emoji: '🛰️',
            unlock: 5,
            bonus: {
              atk: 0.06,
              hp: 0.06,
              def: 0.06,
              spd: 0.06
            }
          },
          gwen: {
            id: 'gwen_c1',
            name: '냉각 장갑',
            emoji: '🛡️',
            unlock: 5,
            bonus: {
              atk: 0.06,
              hp: 0.06,
              def: 0.06,
              spd: 0.06
            }
          },
          ciel: {
            id: 'ciel_c1',
            name: '가속 부스터',
            emoji: '🚀',
            unlock: 5,
            bonus: {
              atk: 0.06,
              hp: 0.06,
              def: 0.06,
              spd: 0.06
            }
          },
          bran: {
            id: 'bran_c1',
            name: '중장 모듈',
            emoji: '🏗️',
            unlock: 5,
            bonus: {
              atk: 0.06,
              hp: 0.06,
              def: 0.06,
              spd: 0.06
            }
          },
          ael: {
            id: 'ael_c1',
            name: '예측 안테나',
            emoji: '📡',
            unlock: 5,
            bonus: {
              atk: 0.06,
              hp: 0.06,
              def: 0.06,
              spd: 0.06
            }
          },
          ara: {
            id: 'ara_c1',
            name: '방전 코일',
            emoji: '⚙️',
            unlock: 5,
            bonus: {
              atk: 0.06,
              hp: 0.06,
              def: 0.06,
              spd: 0.06
            }
          },
          mir: {
            id: 'mir_c1',
            name: '정비 슈트',
            emoji: '🔧',
            unlock: 5,
            bonus: {
              atk: 0.06,
              hp: 0.06,
              def: 0.06,
              spd: 0.06
            }
          },
          pyra: {
            id: 'pyra_c1',
            name: '방열 장갑',
            emoji: '🔥',
            unlock: 5,
            bonus: {
              atk: 0.06,
              hp: 0.06,
              def: 0.06,
              spd: 0.06
            }
          },
          frost: {
            id: 'frost_c1',
            name: '극저온 코팅',
            emoji: '❄️',
            unlock: 5,
            bonus: {
              atk: 0.06,
              hp: 0.06,
              def: 0.06,
              spd: 0.06
            }
          },
          marina: {
            id: 'marina_c1',
            name: '나노 수복막',
            emoji: '🌊',
            unlock: 5,
            bonus: {
              atk: 0.06,
              hp: 0.06,
              def: 0.06,
              spd: 0.06
            }
          },
          signe: {
            id: 'signe_c1',
            name: '지휘 안테나',
            emoji: '🎺',
            unlock: 5,
            bonus: {
              atk: 0.06,
              hp: 0.06,
              def: 0.06,
              spd: 0.06
            }
          },
          aurel: {
            id: 'aurel_c1',
            name: '광자 프레임',
            emoji: '🌟',
            unlock: 5,
            bonus: {
              atk: 0.06,
              hp: 0.06,
              def: 0.06,
              spd: 0.06
            }
          },
          nyx: {
            id: 'nyx_c1',
            name: '심연 코어',
            emoji: '🌌',
            unlock: 5,
            bonus: {
              atk: 0.06,
              hp: 0.06,
              def: 0.06,
              spd: 0.06
            }
          },
          kai: {
            id: 'kai_c1',
            name: '광학 위장복',
            emoji: '🕶️',
            unlock: 5,
            bonus: {
              atk: 0.06,
              hp: 0.06,
              def: 0.06,
              spd: 0.06
            }
          },
          vera: {
            id: 'vera_c1',
            name: '암전 슈트',
            emoji: '🖤',
            unlock: 5,
            bonus: {
              atk: 0.06,
              hp: 0.06,
              def: 0.06,
              spd: 0.06
            }
          },
          robin: {
            id: 'robin_c1',
            name: '위장 스코프',
            emoji: '🍃',
            unlock: 5,
            bonus: {
              atk: 0.06,
              hp: 0.06,
              def: 0.06,
              spd: 0.06
            }
          },
          sylas: {
            id: 'sylas_c1',
            name: '광자 렌즈',
            emoji: '✨',
            unlock: 5,
            bonus: {
              atk: 0.06,
              hp: 0.06,
              def: 0.06,
              spd: 0.06
            }
          },
          elara: {
            id: 'elara_c1',
            name: '플라즈마 코팅',
            emoji: '🔥',
            unlock: 5,
            bonus: {
              atk: 0.06,
              hp: 0.06,
              def: 0.06,
              spd: 0.06
            }
          },
          oriel: {
            id: 'oriel_c1',
            name: '특이점 실드',
            emoji: '🌌',
            unlock: 5,
            bonus: {
              atk: 0.06,
              hp: 0.06,
              def: 0.06,
              spd: 0.06
            }
          },
          toren: {
            id: 'toren_c1',
            name: '시제 장갑판',
            emoji: '🔰',
            unlock: 5,
            bonus: {
              atk: 0.06,
              hp: 0.06,
              def: 0.06,
              spd: 0.06
            }
          },
          kordan: {
            id: 'kordan_c1',
            name: '용암 코팅 장갑',
            emoji: '🌋',
            unlock: 5,
            bonus: {
              atk: 0.06,
              hp: 0.06,
              def: 0.06,
              spd: 0.06
            }
          },
          ymir: {
            id: 'ymir_c1',
            name: '고대 방어 셸',
            emoji: '🏔️',
            unlock: 5,
            bonus: {
              atk: 0.06,
              hp: 0.06,
              def: 0.06,
              spd: 0.06
            }
          },
          nella: {
            id: 'nella_c1',
            name: '견습 치유 모듈',
            emoji: '🌸',
            unlock: 5,
            bonus: {
              atk: 0.06,
              hp: 0.06,
              def: 0.06,
              spd: 0.06
            }
          },
          jax: {
            id: 'jax_c1',
            name: '뒷골목 개조 슈트',
            emoji: '🥋',
            unlock: 5,
            bonus: {
              atk: 0.06,
              hp: 0.06,
              def: 0.06,
              spd: 0.06
            }
          },
          mira: {
            id: 'mira_c1',
            name: '연막 클로킹',
            emoji: '🌫️',
            unlock: 5,
            bonus: {
              atk: 0.06,
              hp: 0.06,
              def: 0.06,
              spd: 0.06
            }
          },
          raven: {
            id: 'raven_c1',
            name: '스텔스 필드',
            emoji: '🌑',
            unlock: 5,
            bonus: {
              atk: 0.06,
              hp: 0.06,
              def: 0.06,
              spd: 0.06
            }
          },
          finn: {
            id: 'finn_c1',
            name: '견습 추적 스코프',
            emoji: '🍂',
            unlock: 5,
            bonus: {
              atk: 0.06,
              hp: 0.06,
              def: 0.06,
              spd: 0.06
            }
          },
          lyra: {
            id: 'lyra_c1',
            name: '월광 조준경',
            emoji: '🌜',
            unlock: 5,
            bonus: {
              atk: 0.06,
              hp: 0.06,
              def: 0.06,
              spd: 0.06
            }
          },
          seren: {
            id: 'seren_c1',
            name: '천공 저격 슈트',
            emoji: '🦅',
            unlock: 5,
            bonus: {
              atk: 0.06,
              hp: 0.06,
              def: 0.06,
              spd: 0.06
            }
          },
          pip: {
            id: 'pip_c1',
            name: '견습 연산 로브',
            emoji: '📗',
            unlock: 5,
            bonus: {
              atk: 0.06,
              hp: 0.06,
              def: 0.06,
              spd: 0.06
            }
          },
          thalia: {
            id: 'thalia_c1',
            name: '냉각 코어 코팅',
            emoji: '🌬️',
            unlock: 5,
            bonus: {
              atk: 0.06,
              hp: 0.06,
              def: 0.06,
              spd: 0.06
            }
          },
          nocturne: {
            id: 'nocturne_c1',
            name: '심연 연산 셸',
            emoji: '🌘',
            unlock: 5,
            bonus: {
              atk: 0.06,
              hp: 0.06,
              def: 0.06,
              spd: 0.06
            }
          }
        },
        // 스토리 캠페인 — 같은 진행/전투 로직, SF 서사로 교체.
        campaign: [{
          title: '궤도 이상',
          story: '스테이션 궤도에 정체불명의 신호. 첫 무인기가 도킹을 시도하고, 시제기들이 출격한다.'
        }, {
          title: '폐기 구역',
          story: '버려진 구획의 시스템이 폭주한다. 오작동한 기계들이 침입자를 요격한다.'
        }, {
          title: '냉각 관문',
          story: '동결된 격벽의 가디언이 통로를 봉쇄한다. 낡은 프로토콜을 고수하는 냉혹한 기체.'
        }, {
          title: '방전 타워',
          story: '전력망이 타워를 휘감는다. 폭주한 에너지 코어가 접근자를 시험한다.'
        }, {
          title: '광자와 암전',
          story: '중앙 코어의 빛이 요동친다. 이탈한 관리 AI가 암전 프로토콜로 구역을 장악했다.'
        }, {
          title: '심층 게이트',
          story: '스테이션 심부의 봉인 게이트가 열린다. 이상 신호의 진원에서 무언가 깨어난다.'
        }, {
          title: '지휘부의 그림자',
          story: '붕괴한 관제탑의 콘솔에 정체불명의 존재가 접속해 있다. 시스템을 삼키려는 자와의 대치.'
        }, {
          title: '프로토콜의 끝',
          story: '이상의 핵심에서 종단 신호가 형상을 갖춘다. 모든 연결과 성장을 걸고 마지막 사출을.'
        },
        // ── 2부: 잔존 신호 ──
        {
          title: '잔존 신호',
          story: '소멸시킨 줄 알았던 이상 신호의 잔재가 재활성된다. 스테이션의 손상은 아직 복구되지 않았다.'
        }, {
          title: '오염된 유닛',
          story: '바이러스에 감염된 옛 동료 기체가 요격해온다. 조준선을 겹치는 손이 무겁다.'
        }, {
          title: '공허 코어',
          story: '게이트 너머 심연에서 온 마스터 코어가 강림한다. 그 연산이 궤도 전체를 잠식한다.'
        }, {
          title: '여명 프로토콜',
          story: '이상의 근원과 마주한다. 모든 것을 건 최종 사출 — 스테이션에 여명이 켜진다.'
        }]
      });
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/season.ts", ['cc', './economy.ts', './mailbox.ts', './gameState.ts', './resolution.ts', './units.ts'], function (exports) {
  var cclegacy, earn, addMail, getPartyUnits, resolve, toCombatProfile;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      earn = module.earn;
    }, function (module) {
      addMail = module.addMail;
    }, function (module) {
      getPartyUnits = module.getPartyUnits;
    }, function (module) {
      resolve = module.resolve;
    }, function (module) {
      toCombatProfile = module.toCombatProfile;
    }],
    execute: function () {
      exports({
        equalizedPower: equalizedPower,
        seasonChallenge: seasonChallenge,
        seasonFloorChallenge: seasonFloorChallenge,
        seasonIndex: seasonIndex,
        seasonInfo: seasonInfo
      });
      cclegacy._RF.push({}, "11efcfN14VBJY1FfiZefcRu", "season", undefined);

      // ─────────────────────────────────────────────────────────────
      // 시즌제 소프트 리셋 콘텐츠 — 고인물 독점 방지 + 신규 기회 제공.
      //   · 메인 성장은 영구 보존하되, 시즌 던전에서는 "전용 버프로 평준화된 조건"에서 겨룬다.
      //   · 스탯 격차를 상수 배수로 압축(정규화)해, 저스펙도 운영/편성으로 상위 도달 가능.
      //   · 2~4주 주기로 리셋(로컬: 누적 점수 마일스톤 정산 → 우편). 서버 시 실 순위로 대체.
      // ─────────────────────────────────────────────────────────────

      var DAY_MS = 86400000;
      var SEASON_DAYS = exports('SEASON_DAYS', 14); // 2주 주기
      var SEASON_FLOORS = exports('SEASON_FLOORS', 30); // 시즌 던전 층수

      function seasonIndex(now) {
        if (now === void 0) {
          now = Date.now();
        }
        return Math.floor(now / (SEASON_DAYS * DAY_MS));
      }

      // 평준화: 파티 원시 전투 지표를 로그 압축해 "스펙 인플레"를 완화한다.
      //   보정력 = 1 + ln(1 + rawPower / PIVOT) * SCALE  (스펙차가 점수차를 지배하지 못하게)
      var PIVOT = 5000;
      var SCALE = 0.6;
      function equalizedPower(party) {
        if (!party || !party.length) return 0;
        var profiles = party.map(toCombatProfile);
        var raw = profiles.reduce(function (s, p) {
          return s + p.dps + p.hp * 0.1;
        }, 0);
        return Math.round(1000 * (1 + Math.log(1 + raw / PIVOT) * SCALE));
      }

      // 시즌 던전 한 층의 도전 난이도(층이 오를수록 가파르게).
      function seasonFloorChallenge(floor) {
        var t = floor - 1;
        return {
          hp: Math.round(20000 * Math.pow(1.35, t)),
          atk: Math.round(400 * Math.pow(1.28, t)),
          def: Math.round(80 * Math.pow(1.22, t)),
          element: null
        };
      }
      function ensure(state, now) {
        state.season2 = state.season2 || {
          idx: -1,
          floor: 0,
          best: 0
        };
        var idx = seasonIndex(now);
        if (state.season2.idx !== idx) {
          // 시즌 정산(로컬): 지난 시즌 도달 층 × 상수 → 우편 보상.
          if (state.season2.idx >= 0 && state.season2.best > 0) {
            var gem = Math.min(2000, state.season2.best * 20);
            addMail(state, {
              title: "\uC2DC\uC98C " + (state.season2.idx + 1) + " \uC815\uC0B0 \uBCF4\uC0C1",
              reward: {
                gem: gem
              },
              ts: now
            });
          }
          state.season2 = {
            idx: idx,
            floor: 0,
            best: 0
          };
        }
        return state.season2;
      }

      // UI 현황: 현재 시즌·도달 층·평준화 전투력·남은 시간.
      function seasonInfo(state, now) {
        if (now === void 0) {
          now = Date.now();
        }
        var s = ensure(state, now);
        var endsAt = (seasonIndex(now) + 1) * SEASON_DAYS * DAY_MS;
        return {
          season: s.idx + 1,
          floor: s.floor,
          best: s.best,
          maxFloor: SEASON_FLOORS,
          power: equalizedPower(getPartyUnits(state)),
          endsInMs: Math.max(0, endsAt - now)
        };
      }

      // 다음 층 도전 — 평준화 조건에서 판정. 승리 시 층+1·점수 갱신, 보상 지급.
      function seasonChallenge(state, now) {
        if (now === void 0) {
          now = Date.now();
        }
        var s = ensure(state, now);
        if (s.floor >= SEASON_FLOORS) return {
          ok: false,
          reason: '최고 층 도달'
        };
        var party = getPartyUnits(state);
        if (!party.length) return {
          ok: false,
          reason: '파티 없음'
        };
        var nextFloor = s.floor + 1;
        var ch = seasonFloorChallenge(nextFloor);
        // 평준화: 계정 배수를 쓰지 않고(공정), 파티 원시 스탯으로만 판정.
        var r = resolve(party, ch);
        if (!r.win) return {
          ok: false,
          reason: nextFloor + "\uCE35 \uD074\uB9AC\uC5B4 \uC2E4\uD328",
          floor: s.floor,
          margin: r.margin
        };
        s.floor = nextFloor;
        s.best = Math.max(s.best, nextFloor);
        var reward = {
          gem: 3 + nextFloor,
          currency: 500 * nextFloor
        };
        earn(state.wallet, reward);
        return {
          ok: true,
          floor: s.floor,
          reward: reward,
          cleared: nextFloor >= SEASON_FLOORS
        };
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/seed.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './intimacy.ts', './features.ts'], function (exports) {
  var _createForOfIteratorHelperLoose, cclegacy, intimacyLevel, isOn;
  return {
    setters: [function (module) {
      _createForOfIteratorHelperLoose = module.createForOfIteratorHelperLoose;
    }, function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      intimacyLevel = module.intimacyLevel;
    }, function (module) {
      isOn = module.isOn;
    }],
    execute: function () {
      exports({
        rarityBaseMult: rarityBaseMult,
        seedConditions: seedConditions,
        seedProgress: seedProgress,
        seedStatPct: seedStatPct
      });
      cclegacy._RF.push({}, "4f98cnfSwlM9Ily6gsLkmIm", "seed", undefined);

      // ─────────────────────────────────────────────────────────────
      // 씨앗(Seed) — 모든 캐릭터의 "서사 발현" 시스템.
      //   · 6가지 조건을 달성할수록 서사가 열리고, 조건마다 일부 능력치가 붙는다.
      //   · 저등급일수록 씨앗 보정이 크다(구제 축) — 대신 완전 발현해도
      //     동일 강화 상태의 최고등급(UR/SSR)을 "살짝" 못 넘도록 튜닝.
      //   · 조건 난이도는 등급별 차등: 낮은 등급일수록 문턱이 낮다.
      //
      // 설계 수치 검증(동일 강화 상태 실효 배수 = 등급기본배수 × (1+완전씨앗)):
      //   N   1.00 × 1.30 = 1.300   ← 완전 발현해도
      //   R   1.10 × 1.22 = 1.342
      //   SR  1.22 × 1.14 = 1.391
      //   SSR 1.36 × 1.08 = 1.469   ← 완전 SSR도 무발현 UR(1.500) 아래에 머문다
      //   UR  1.50 × 1.05 = 1.575   ← 최고 티어(새 천장). 하한(1.500)조차 완전SSR 위.
      //
      // 씨앗은 별도 세이브 필드가 없다. 오직 유닛의 투자 상태(레벨/랭크/친밀도/
      // 전용무기/각성/룬)의 "투영"이라, 성장하면 저절로 발현한다.
      // ─────────────────────────────────────────────────────────────

      // 등급 → 티어 인덱스 (조건 문턱/보정 계산용). 등급 없으면 -1(씨앗 없음).
      var TIER = {
        N: 0,
        R: 1,
        SR: 2,
        SSR: 3,
        UR: 4
      };

      // 등급 기본 스탯 배수 (등급이 곧 잠재력의 하한). 등급 없으면 1.0(하위호환).
      var RARITY_BASE_MULT = exports('RARITY_BASE_MULT', {
        N: 1.0,
        R: 1.10,
        SR: 1.22,
        SSR: 1.36,
        UR: 1.50
      });

      // 완전 발현(6/6) 시 총 씨앗 보정. 낮은 등급일수록 크다(구제 축).
      var SEED_FULL = exports('SEED_FULL', {
        N: 0.30,
        R: 0.22,
        SR: 0.14,
        SSR: 0.08,
        UR: 0.05
      });
      function rarityBaseMult(unit) {
        var _RARITY_BASE_MULT$uni;
        if (!isOn('rarity')) return 1.0; // 등급 옵션 off → 전투력 등급 무관(스탯 전용)
        return (_RARITY_BASE_MULT$uni = RARITY_BASE_MULT[unit.rarity]) != null ? _RARITY_BASE_MULT$uni : 1.0;
      }
      function tierOf(unit) {
        var _TIER$unit$rarity;
        return (_TIER$unit$rarity = TIER[unit.rarity]) != null ? _TIER$unit$rarity : -1;
      }

      // 6가지 조건. thr=[N,R,SR,SSR] 등급별 문턱(낮은 등급일수록 낮음).
      // 각 조건은 달성 시 stat에 (완전씨앗/6) 만큼의 statPct를 부여한다.
      // thr=[N,R,SR,SSR,UR] 등급별 문턱(낮은 등급일수록 낮음, UR이 가장 높음).
      var CONDITIONS = [{
        id: 'talent',
        label: '재능 각성',
        narr: '잠든 재능이 깨어난다',
        stat: 'hp',
        metric: function metric(u) {
          return u.level;
        },
        thr: [20, 40, 60, 80, 90],
        unitLabel: '레벨'
      }, {
        id: 'breakthrough',
        label: '한계 돌파',
        narr: '벽을 넘어선 자',
        stat: 'atk',
        metric: function metric(u) {
          return u.rank;
        },
        thr: [2, 3, 4, 5, 6],
        unitLabel: '랭크'
      }, {
        id: 'bond',
        label: '유대',
        narr: '곁을 지키는 마음',
        stat: 'def',
        metric: function metric(u) {
          return intimacyLevel(u);
        },
        thr: [2, 4, 6, 8, 10],
        unitLabel: '친밀도'
      }, {
        id: 'oath',
        label: '무기의 서약',
        narr: '무기와 하나가 되다',
        stat: 'atk',
        metric: function metric(u) {
          var _u$sigWeapon;
          return ((_u$sigWeapon = u.sigWeapon) == null ? void 0 : _u$sigWeapon.level) || 0;
        },
        thr: [3, 6, 9, 12, 15],
        unitLabel: '전용무기'
      }, {
        id: 'resonance',
        label: '심연의 공명',
        narr: '내면이 공명한다',
        stat: 'spd',
        metric: function metric(u) {
          return u.sigAwaken || 0;
        },
        thr: [1, 2, 3, 3, 3],
        unitLabel: '각성'
      }, {
        id: 'runeway',
        label: '룬의 인도',
        narr: '룬이 길을 연다',
        stat: 'hp',
        metric: function metric(u) {
          return (u.runes || []).filter(Boolean).length;
        },
        thr: [1, 2, 3, 3, 3],
        unitLabel: '룬 장착'
      }];
      var SEED_CONDITION_COUNT = exports('SEED_CONDITION_COUNT', CONDITIONS.length);

      // 유닛의 씨앗 조건 현황 (UI/판정 공용).
      function seedConditions(unit) {
        var t = tierOf(unit);
        if (t < 0) return [];
        var full = SEED_FULL[unit.rarity] || 0;
        var per = full / CONDITIONS.length;
        return CONDITIONS.map(function (c) {
          var need = c.thr[t];
          var cur = c.metric(unit);
          return {
            id: c.id,
            label: c.label,
            narrative: c.narr,
            stat: c.stat,
            unitLabel: c.unitLabel,
            need: need,
            cur: cur,
            met: cur >= need,
            value: per
          };
        });
      }
      function seedProgress(unit) {
        var cs = seedConditions(unit);
        var met = cs.filter(function (c) {
          return c.met;
        }).length;
        return {
          hasSeed: cs.length > 0,
          met: met,
          total: cs.length || SEED_CONDITION_COUNT,
          fullyUnlocked: cs.length > 0 && met === cs.length,
          full: SEED_FULL[unit.rarity] || 0
        };
      }

      // 씨앗이 주는 statPct 합 (달성 조건분). modifiers 파이프라인이 합산.
      function seedStatPct(unit) {
        var out = {
          atk: 0,
          hp: 0,
          def: 0,
          spd: 0
        };
        for (var _iterator = _createForOfIteratorHelperLoose(seedConditions(unit)), _step; !(_step = _iterator()).done;) {
          var c = _step.value;
          if (c.met) out[c.stat] += c.value;
        }
        return out;
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/shop.ts", ['cc', './economy.ts', './progression.ts', './daily.ts', './cosmetics.ts'], function (exports) {
  var cclegacy, earn, spend, getStage, refreshDaily, grantPremium;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      earn = module.earn;
      spend = module.spend;
    }, function (module) {
      getStage = module.getStage;
    }, function (module) {
      refreshDaily = module.refreshDaily;
    }, function (module) {
      grantPremium = module.grantPremium;
    }],
    execute: function () {
      exports({
        adLeft: adLeft,
        packageOwned: packageOwned,
        purchase: purchase
      });
      cclegacy._RF.push({}, "41289nSMv9P+YlZQKlGLeH5", "shop", undefined);

      // ─────────────────────────────────────────────────────────────
      // BM/상점 골격 — 3종 구매 경로:
      //   · ad     : 광고 시청(무료), 하루 횟수 제한
      //   · gem    : 프리미엄 재화(다이아) 소모
      //   · package: 실결제(모의) — 결제 연동은 골격만, 누르면 보상 지급
      //
      // grant의 *Stage 키는 현재 진행도(peakStage) 보상에 비례해 스케일한다.
      // ─────────────────────────────────────────────────────────────

      var SHOP = exports('SHOP', {
        ad: [{
          id: 'AD_GOLD',
          label: '광고 보고 골드',
          limit: 5,
          grant: {
            currencyStage: 60
          }
        }, {
          id: 'AD_SUMMON',
          label: '광고 보고 소환권',
          limit: 3,
          grant: {
            summon: 10
          }
        }, {
          id: 'AD_GEM',
          label: '광고 보고 다이아',
          limit: 3,
          grant: {
            gem: 5
          }
        }],
        gem: [{
          id: 'GEM_SUMMON',
          label: '소환권 100',
          cost: {
            gem: 60
          },
          grant: {
            summon: 100
          }
        }, {
          id: 'GEM_GOLD',
          label: '골드 대량',
          cost: {
            gem: 30
          },
          grant: {
            currencyStage: 200
          }
        }, {
          id: 'GEM_GROWTH',
          label: '정수 대량',
          cost: {
            gem: 30
          },
          grant: {
            growthStage: 200
          }
        }],
        // 금액대별 사다리 — 위로 갈수록 ₩당 다이아 가치가 커진다(고액 유도).
        "package": [{
          id: 'PKG_ADFREE',
          label: '광고 제거 패스',
          krw: '₩5,500',
          once: true,
          tag: '편의',
          premium: true,
          note: '광고 없이 광고보상·오프라인 2배 자동',
          grant: {
            gem: 100
          }
        }, {
          id: 'PKG_STARTER',
          label: '스타터 패키지',
          krw: '₩4,900',
          once: true,
          tag: '입문',
          grant: {
            gem: 300,
            summon: 50,
            currencyStage: 150
          }
        }, {
          id: 'PKG_MONTHLY',
          label: '월정액',
          krw: '₩9,900',
          once: true,
          note: '즉시 다이아 + 매일 지급(골격)',
          grant: {
            gem: 300
          }
        }, {
          id: 'PKG_GROWTH',
          label: '성장 패키지',
          krw: '₩11,000',
          grant: {
            gem: 500,
            growthStage: 300
          }
        }, {
          id: 'PKG_VALUE',
          label: '특별 가치 패키지',
          krw: '₩29,000',
          tag: '인기',
          grant: {
            gem: 1800,
            summon: 150,
            growthStage: 300
          }
        }, {
          id: 'PKG_PREMIUM',
          label: '프리미엄 패키지',
          krw: '₩59,000',
          grant: {
            gem: 3800,
            summon: 350,
            currencyStage: 400,
            growthStage: 400
          }
        }, {
          id: 'PKG_LEGEND',
          label: '레전드 패키지',
          krw: '₩99,000',
          tag: '최고 가치',
          grant: {
            gem: 6600,
            summon: 700,
            growthStage: 800
          }
        }, {
          id: 'PKG_ULTIMATE',
          label: '궁극 후원 패키지',
          krw: '₩129,000',
          tag: '한정',
          grant: {
            gem: 9200,
            summon: 1000,
            currencyStage: 600,
            growthStage: 1200
          }
        }]
      });
      function allProducts() {
        return [].concat(SHOP.ad, SHOP.gem, SHOP["package"]);
      }
      function find(id) {
        return allProducts().find(function (p) {
          return p.id === id;
        });
      }

      // grant 정의 → 실제 지급량 (진행도 스케일 반영)
      function resolveGrant(state, grant) {
        var st = getStage(state.peakStage).rewards;
        var out = {};
        for (var _i = 0, _arr = Object.entries(grant); _i < _arr.length; _i++) {
          var _arr$_i = _arr[_i],
            k = _arr$_i[0],
            v = _arr$_i[1];
          if (k === 'currencyStage') out.currency = (out.currency || 0) + Math.round(st.currency * v);else if (k === 'growthStage') out.growth = (out.growth || 0) + Math.round(st.growth * v);else out[k] = (out[k] || 0) + v;
        }
        return out;
      }
      function adLeft(state, id, now) {
        if (now === void 0) {
          now = Date.now();
        }
        refreshDaily(state, now);
        var p = find(id);
        return p ? p.limit - (state.daily.ads[id] || 0) : 0;
      }
      function packageOwned(state, id) {
        return !!(state.shop && state.shop.purchased[id]);
      }

      // 구매 처리. 성공 시 { ok, grant }.
      function purchase(state, id, now) {
        if (now === void 0) {
          now = Date.now();
        }
        var p = find(id);
        if (!p) return {
          ok: false,
          reason: '알 수 없는 상품'
        };
        refreshDaily(state, now);
        if (p.limit) {
          // 광고
          if ((state.daily.ads[id] || 0) >= p.limit) return {
            ok: false,
            reason: '오늘 횟수 소진'
          };
          var _g = resolveGrant(state, p.grant);
          earn(state.wallet, _g);
          state.daily.ads[id] = (state.daily.ads[id] || 0) + 1;
          return {
            ok: true,
            grant: _g
          };
        }
        if (p.cost) {
          // 다이아
          if (!spend(state.wallet, p.cost)) return {
            ok: false,
            reason: '다이아 부족',
            cost: p.cost
          };
          var _g2 = resolveGrant(state, p.grant);
          earn(state.wallet, _g2);
          return {
            ok: true,
            grant: _g2
          };
        }
        // 패키지 (모의 결제)
        if (p.once && packageOwned(state, id)) return {
          ok: false,
          reason: '구매 완료'
        };
        var g = resolveGrant(state, p.grant);
        earn(state.wallet, g);
        state.shop = state.shop || {
          purchased: {}
        };
        if (p.once) state.shop.purchased[id] = true;
        if (p.premium) grantPremium(state); // 광고제거 패스 활성화
        // 과금 등급(VIP) — 누적 결제액 적립(코스튬 해금용). krw 문자열에서 숫자만 추출.
        var krw = parseInt(String(p.krw || '').replace(/[^0-9]/g, ''), 10) || 0;
        if (krw) {
          state.vip = state.vip || {
            spend: 0
          };
          state.vip.spend += krw;
        }
        return {
          ok: true,
          grant: g,
          mock: true,
          premium: !!p.premium
        };
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/sigweapon.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './economy.ts'], function (exports) {
  var _extends, cclegacy, spend;
  return {
    setters: [function (module) {
      _extends = module.extends;
    }, function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      spend = module.spend;
    }],
    execute: function () {
      exports({
        canOwnSigWeapon: canOwnSigWeapon,
        enhanceSigWeapon: enhanceSigWeapon,
        hasSigWeapon: hasSigWeapon,
        sigWeaponBoost: sigWeaponBoost,
        sigWeaponContribution: sigWeaponContribution,
        sigWeaponEnhanceCost: sigWeaponEnhanceCost,
        sigWeaponUnlockCost: sigWeaponUnlockCost,
        unlockSigWeapon: unlockSigWeapon
      });
      cclegacy._RF.push({}, "67cdaqpse9NIo/ZeRCl+WjK", "sigweapon", undefined);

      // ─────────────────────────────────────────────────────────────
      // 전용무기 — 캐릭터(고유 스킬 보유자)만의 무기. 일반 장비와 "별도 슬롯"이라
      // 무기/방어구/장신구와 경쟁하지 않는다(순수 추가 성장).
      //   · 스탯 프로필은 원형(archetype)을 따른다 → 캐릭터 성격에 맞게.
      //   · 레벨(강화)로 성장하고, 5레벨마다 시그니처 스킬을 증폭한다.
      //     "정체성(시그니처)이 곧 성장한다"는 IP 원칙의 심화.
      //   · Concept가 이름/외형을, Core가 수치를 담당.
      // ─────────────────────────────────────────────────────────────

      // 원형별 무기 스탯 프로필 (Lv.1 기준). 강화 시 flat이 비례 성장.
      var PROFILE = {
        STRIKER: {
          flat: {
            atk: 200
          },
          effect: {
            critDamage: 0.4
          }
        },
        VANGUARD: {
          flat: {
            hp: 1200,
            def: 100
          },
          effect: {}
        },
        SUPPORT: {
          flat: {
            atk: 120,
            spd: 40
          },
          effect: {}
        },
        ROGUE: {
          flat: {
            atk: 180,
            spd: 30
          },
          effect: {
            critChance: 0.12
          }
        },
        ARCHER: {
          flat: {
            atk: 170,
            spd: 20
          },
          effect: {
            critDamage: 0.2
          }
        },
        MAGE: {
          flat: {
            atk: 230
          },
          effect: {
            critDamage: 0.3
          }
        }
      };
      var WEAPON_ENH_PER = 0.15; // 강화 레벨당 flat +15%
      var SIGWEAPON_MAX = exports('SIGWEAPON_MAX', 15);
      var SIG_BOOST_PER_TIER = 0.1; // 5레벨마다 시그니처 강도 +10%

      function hasSigWeapon(unit) {
        return !!(unit.sigWeapon && unit.sigWeapon.level > 0);
      }

      // 전용무기를 가질 수 있는가 (고유 스킬 보유 = 정체성 있는 캐릭터).
      function canOwnSigWeapon(unit) {
        return !!unit.signature;
      }
      function sigWeaponUnlockCost() {
        return {
          gem: 40
        };
      }
      function sigWeaponEnhanceCost(level) {
        return {
          currency: Math.round(300 * Math.pow(1.28, level))
        };
      }
      function findUnit(state, uid) {
        var u = state.units.find(function (x) {
          return x.uid === uid;
        });
        if (!u) throw new Error("\uC720\uB2DB \uC5C6\uC74C: " + uid);
        return u;
      }

      // 전용무기 획득(1회). 프리미엄 재화 소모.
      function unlockSigWeapon(state, uid) {
        var u = findUnit(state, uid);
        if (!canOwnSigWeapon(u)) return {
          ok: false,
          reason: '전용무기 없음 (고유 스킬 미보유)'
        };
        if (hasSigWeapon(u)) return {
          ok: false,
          reason: '이미 획득'
        };
        if (!spend(state.wallet, sigWeaponUnlockCost())) return {
          ok: false,
          reason: '재화 부족',
          cost: sigWeaponUnlockCost()
        };
        u.sigWeapon = {
          level: 1
        };
        return {
          ok: true,
          level: 1
        };
      }

      // 전용무기 강화.
      function enhanceSigWeapon(state, uid) {
        var u = findUnit(state, uid);
        if (!hasSigWeapon(u)) return {
          ok: false,
          reason: '미획득'
        };
        if (u.sigWeapon.level >= SIGWEAPON_MAX) return {
          ok: false,
          reason: "\uAC15\uD654 \uC0C1\uD55C " + SIGWEAPON_MAX
        };
        var cost = sigWeaponEnhanceCost(u.sigWeapon.level);
        if (!spend(state.wallet, cost)) return {
          ok: false,
          reason: '강화 재화 부족',
          cost: cost
        };
        u.sigWeapon.level += 1;
        return {
          ok: true,
          level: u.sigWeapon.level,
          cost: cost
        };
      }

      // 시그니처 증폭 계수 (모디파이어에서 시그니처 scale에 곱함).
      function sigWeaponBoost(unit) {
        if (!hasSigWeapon(unit)) return 0;
        return Math.floor(unit.sigWeapon.level / 5) * SIG_BOOST_PER_TIER;
      }

      // 모디파이어 기여 (flat 스탯 + 전투 효과). 강화 레벨 반영.
      function sigWeaponContribution(unit) {
        if (!hasSigWeapon(unit)) return null;
        var p = PROFILE[unit.archetype] || PROFILE.STRIKER;
        var scale = 1 + WEAPON_ENH_PER * (unit.sigWeapon.level - 1);
        var flat = {};
        for (var _i = 0, _arr = Object.entries(p.flat); _i < _arr.length; _i++) {
          var _arr$_i = _arr[_i],
            k = _arr$_i[0],
            v = _arr$_i[1];
          flat[k] = v * scale;
        }
        return {
          flat: flat,
          effect: _extends({}, p.effect)
        };
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/skills.ts", ['cc'], function (exports) {
  var cclegacy;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }],
    execute: function () {
      exports({
        awakenCost: awakenCost,
        equippableSkills: equippableSkills,
        getSkill: getSkill,
        skillPower: skillPower,
        skillSlots: skillSlots,
        skillUpCost: skillUpCost
      });
      cclegacy._RF.push({}, "7ebacuuhQtBTZ7YtkeXAEG3", "skills", undefined);
      // ─────────────────────────────────────────────────────────────
      // 스킬 시스템 — 장착(선택)으로 같은 유닛을 다른 빌드로 만든다.
      // 스킬은 시스템 레벨의 "효과 ID"다. 표시 이름은 컨셉이 붙일 수 있다.
      //
      // 스킬이 줄 수 있는 것:
      //   statPct  : 자기 스탯 % 증가 (atk/hp/def/spd)
      //   effect   : 전투 효과 (치명타/흡혈/방어관통) → 판정 엔진이 읽음
      //   teamBuff : 팀 전체 버프 (예: 공격력 %)
      //   level    : 스킬 레벨(강화 가능) → 효과가 레벨에 비례
      // ─────────────────────────────────────────────────────────────

      var SKILL_CATALOG = exports('SKILL_CATALOG', {
        BERSERK: {
          id: 'BERSERK',
          label: '광폭',
          desc: '공격력 대폭 상승',
          statPct: {
            atk: 0.30
          }
        },
        FORTRESS: {
          id: 'FORTRESS',
          label: '요새',
          desc: '체력·방어 상승',
          statPct: {
            hp: 0.25,
            def: 0.20
          }
        },
        PRECISION: {
          id: 'PRECISION',
          label: '정밀',
          desc: '치명타 확률/피해',
          effect: {
            critChance: 0.25,
            critDamage: 0.5
          }
        },
        VAMPIRIC: {
          id: 'VAMPIRIC',
          label: '흡혈',
          desc: '가한 피해로 생존력 확보',
          effect: {
            lifesteal: 0.30
          }
        },
        PIERCE: {
          id: 'PIERCE',
          label: '관통',
          desc: '적 방어 무시',
          effect: {
            defPierce: 0.40
          }
        },
        RALLY: {
          id: 'RALLY',
          label: '지휘',
          desc: '팀 전체 공격력 상승',
          teamBuff: {
            atk: 0.20
          }
        },
        SWIFT: {
          id: 'SWIFT',
          label: '신속',
          desc: '속도 상승(공격 빈도)',
          statPct: {
            spd: 0.40
          }
        },
        RUIN: {
          id: 'RUIN',
          label: '파멸',
          desc: '방어 무시 + 치명 피해 (글래스캐논)',
          effect: {
            defPierce: 0.30,
            critDamage: 0.50
          }
        },
        UNDYING: {
          id: 'UNDYING',
          label: '불굴',
          desc: '체력 + 흡혈 (브루저 생존)',
          statPct: {
            hp: 0.30
          },
          effect: {
            lifesteal: 0.25
          }
        },
        ONSLAUGHT: {
          id: 'ONSLAUGHT',
          label: '맹공',
          desc: '공격 + 속도 (연속 압박)',
          statPct: {
            atk: 0.20,
            spd: 0.30
          }
        },
        BULWARK: {
          id: 'BULWARK',
          label: '철벽',
          desc: '방어 + 체력 대폭 (순수 탱커)',
          statPct: {
            def: 0.30,
            hp: 0.35
          }
        },
        PERFECT: {
          id: 'PERFECT',
          label: '완성',
          desc: '전 스탯 균형 상승',
          statPct: {
            atk: 0.12,
            hp: 0.12,
            def: 0.12,
            spd: 0.12
          }
        },
        GUARDING: {
          id: 'GUARDING',
          label: '철옹',
          desc: '받는 피해 감소 (생존 특화)',
          effect: {
            dmgReduce: 0.18
          }
        },
        // ── 전용(시그니처) 스킬 ─────────────────────────────────────
        // 캐릭터 고유 능력. 일반 슬롯에 장착하는 게 아니라 항상 발동하며,
        // 랭크가 오를수록 강해진다(정체성 = 성장). signature:true 로 표시.
        // awaken: 각성(sigAwaken 레벨) 당 추가되는 2차 효과.
        SIG_FLAME_EDGE: {
          id: 'SIG_FLAME_EDGE',
          label: '불꽃검',
          desc: '공격+치명 특화',
          signature: true,
          statPct: {
            atk: 0.15
          },
          effect: {
            critChance: 0.2,
            critDamage: 0.6
          },
          awaken: {
            effect: {
              defPierce: 0.1
            }
          }
        },
        SIG_MOON_BLESSING: {
          id: 'SIG_MOON_BLESSING',
          label: '달의 축복',
          desc: '팀 공격+흡혈',
          signature: true,
          teamBuff: {
            atk: 0.25
          },
          effect: {
            lifesteal: 0.15
          },
          awaken: {
            teamBuff: {
              atk: 0.06
            }
          }
        },
        SIG_FROST_GUARD: {
          id: 'SIG_FROST_GUARD',
          label: '서리방벽',
          desc: '체력·방어 특화',
          signature: true,
          statPct: {
            hp: 0.30,
            def: 0.25
          },
          awaken: {
            effect: {
              lifesteal: 0.06
            }
          }
        },
        SIG_WIND_DANCE: {
          id: 'SIG_WIND_DANCE',
          label: '바람춤',
          desc: '속도·공격',
          signature: true,
          statPct: {
            spd: 0.5,
            atk: 0.1
          },
          awaken: {
            statPct: {
              atk: 0.06
            }
          }
        },
        SIG_EARTH_AEGIS: {
          id: 'SIG_EARTH_AEGIS',
          label: '대지수호',
          desc: '체력·흡혈',
          signature: true,
          statPct: {
            hp: 0.2
          },
          effect: {
            lifesteal: 0.2
          },
          awaken: {
            statPct: {
              def: 0.08
            }
          }
        },
        SIG_LIGHT_ORACLE: {
          id: 'SIG_LIGHT_ORACLE',
          label: '빛의 신탁',
          desc: '팀 공격+팀 치명',
          signature: true,
          teamBuff: {
            atk: 0.1,
            critChance: 0.12
          },
          effect: {
            critChance: 0.15
          },
          awaken: {
            teamBuff: {
              critChance: 0.04
            }
          }
        },
        SIG_STORM_BLADE: {
          id: 'SIG_STORM_BLADE',
          label: '폭풍검',
          desc: '공격·관통',
          signature: true,
          statPct: {
            atk: 0.2
          },
          effect: {
            defPierce: 0.2
          },
          awaken: {
            effect: {
              critChance: 0.03
            }
          }
        },
        SIG_NOVICE: {
          id: 'SIG_NOVICE',
          label: '견습 일격',
          desc: '기본 공격 강화',
          signature: true,
          statPct: {
            atk: 0.12
          },
          awaken: {
            statPct: {
              atk: 0.05
            }
          }
        },
        // ── P1 신규 캐릭터 전용 스킬 ────────────────────────────────
        SIG_EMBER_WALL: {
          id: 'SIG_EMBER_WALL',
          label: '잉걸 방벽',
          desc: '체력·방어+흡혈(불굴 수호)',
          signature: true,
          statPct: {
            hp: 0.25,
            def: 0.20
          },
          effect: {
            lifesteal: 0.12
          },
          awaken: {
            statPct: {
              def: 0.08
            }
          }
        },
        SIG_GLACIER_EDGE: {
          id: 'SIG_GLACIER_EDGE',
          label: '빙하검',
          desc: '공격+관통·치명피해(처형)',
          signature: true,
          statPct: {
            atk: 0.18
          },
          effect: {
            defPierce: 0.15,
            critDamage: 0.4
          },
          awaken: {
            effect: {
              critChance: 0.05
            }
          }
        },
        SIG_TIDE_HYMN: {
          id: 'SIG_TIDE_HYMN',
          label: '조수 성가',
          desc: '팀 피해경감+강한 흡혈(수호 치유)',
          signature: true,
          teamBuff: {
            def: 0.15
          },
          effect: {
            lifesteal: 0.25
          },
          awaken: {
            teamBuff: {
              def: 0.05
            }
          }
        },
        SIG_WAR_CHANT: {
          id: 'SIG_WAR_CHANT',
          label: '전열 함성',
          desc: '팀 공격+자신 속도(지휘)',
          signature: true,
          teamBuff: {
            atk: 0.20
          },
          statPct: {
            spd: 0.2
          },
          awaken: {
            teamBuff: {
              atk: 0.05
            }
          }
        },
        // ── P3 신화(UR) 전용 스킬 — 최상위, 복합 강력 ────────────────
        SIG_DAWNBREAKER: {
          id: 'SIG_DAWNBREAKER',
          label: '여명검',
          desc: '공격+치명+관통+팀치명(초월 딜러)',
          signature: true,
          statPct: {
            atk: 0.25
          },
          effect: {
            critChance: 0.25,
            critDamage: 0.6,
            defPierce: 0.15
          },
          teamBuff: {
            critChance: 0.08
          },
          awaken: {
            effect: {
              critDamage: 0.2
            }
          }
        },
        SIG_ABYSS_ORACLE: {
          id: 'SIG_ABYSS_ORACLE',
          label: '심연 계시',
          desc: '팀 공격+피해경감+치명(만능 지원)',
          signature: true,
          teamBuff: {
            atk: 0.18,
            def: 0.12,
            critChance: 0.1
          },
          effect: {
            lifesteal: 0.1
          },
          awaken: {
            teamBuff: {
              atk: 0.05,
              def: 0.03
            }
          }
        },
        // ── 신규 원형(도적·궁수·법사) 전용 스킬 ───────────────────────
        SIG_ROGUE_NOVICE: {
          id: 'SIG_ROGUE_NOVICE',
          label: '재빠른 손놀림',
          desc: '속도 강화(도적 입문)',
          signature: true,
          statPct: {
            spd: 0.15
          },
          awaken: {
            effect: {
              critChance: 0.04
            }
          }
        },
        SIG_NIGHT_FANG: {
          id: 'SIG_NIGHT_FANG',
          label: '야습의 송곳니',
          desc: '속도+공격+치명 특화(암습)',
          signature: true,
          statPct: {
            spd: 0.3,
            atk: 0.12
          },
          effect: {
            critChance: 0.25,
            critDamage: 0.5
          },
          awaken: {
            effect: {
              defPierce: 0.1
            }
          }
        },
        SIG_FOREST_ARROW: {
          id: 'SIG_FOREST_ARROW',
          label: '숲의 화살',
          desc: '공격+치명(정밀 사격)',
          signature: true,
          statPct: {
            atk: 0.15
          },
          effect: {
            critChance: 0.15
          },
          awaken: {
            statPct: {
              spd: 0.05
            }
          }
        },
        SIG_LIGHT_ARROW: {
          id: 'SIG_LIGHT_ARROW',
          label: '광명의 화살',
          desc: '공격+치명+관통+팀치명(저격)',
          signature: true,
          statPct: {
            atk: 0.18
          },
          effect: {
            critChance: 0.2,
            defPierce: 0.15
          },
          teamBuff: {
            critChance: 0.06
          },
          awaken: {
            effect: {
              critDamage: 0.15
            }
          }
        },
        SIG_INFERNO_BOLT: {
          id: 'SIG_INFERNO_BOLT',
          label: '화염 마탄',
          desc: '공격+치명피해(마법 폭발)',
          signature: true,
          statPct: {
            atk: 0.18
          },
          effect: {
            critDamage: 0.3
          },
          awaken: {
            effect: {
              critChance: 0.05
            }
          }
        },
        SIG_CHAOS_NOVA: {
          id: 'SIG_CHAOS_NOVA',
          label: '혼돈의 신성',
          desc: '공격+치명+관통+팀공격(초월 캐스터)',
          signature: true,
          statPct: {
            atk: 0.28
          },
          effect: {
            critChance: 0.22,
            critDamage: 0.55,
            defPierce: 0.12
          },
          teamBuff: {
            atk: 0.1
          },
          awaken: {
            effect: {
              critDamage: 0.2
            }
          }
        },
        // ── 원형별 등급 공백 보강(N/R/SR/SSR/UR 전 등급 커버) ─────────
        SIG_VANGUARD_NOVICE: {
          id: 'SIG_VANGUARD_NOVICE',
          label: '풋내기 방벽',
          desc: '체력 강화(수호 입문)',
          signature: true,
          statPct: {
            hp: 0.15
          },
          awaken: {
            statPct: {
              def: 0.05
            }
          }
        },
        SIG_FLAME_BASTION: {
          id: 'SIG_FLAME_BASTION',
          label: '화염 요새',
          desc: '체력·방어+피해감소(불굴 수호)',
          signature: true,
          statPct: {
            hp: 0.22,
            def: 0.18
          },
          effect: {
            dmgReduce: 0.15
          },
          awaken: {
            effect: {
              lifesteal: 0.06
            }
          }
        },
        SIG_GLACIAL_TITAN: {
          id: 'SIG_GLACIAL_TITAN',
          label: '빙하 거인',
          desc: '체력·방어+피해감소+팀방어(초월 수호)',
          signature: true,
          statPct: {
            hp: 0.3,
            def: 0.25
          },
          effect: {
            dmgReduce: 0.2,
            lifesteal: 0.1
          },
          teamBuff: {
            def: 0.1
          },
          awaken: {
            effect: {
              dmgReduce: 0.08
            }
          }
        },
        SIG_SUPPORT_NOVICE: {
          id: 'SIG_SUPPORT_NOVICE',
          label: '견습 축복',
          desc: '팀 공격 소폭(지원 입문)',
          signature: true,
          teamBuff: {
            atk: 0.08
          },
          awaken: {
            teamBuff: {
              atk: 0.03
            }
          }
        },
        SIG_ALLEY_BLADE: {
          id: 'SIG_ALLEY_BLADE',
          label: '뒷골목 칼솜씨',
          desc: '속도+치명(거리의 칼잡이)',
          signature: true,
          statPct: {
            spd: 0.2
          },
          effect: {
            critChance: 0.15
          },
          awaken: {
            effect: {
              critDamage: 0.1
            }
          }
        },
        SIG_MIST_STRIKE: {
          id: 'SIG_MIST_STRIKE',
          label: '안개 일격',
          desc: '속도+공격+회피(안개 속 기습)',
          signature: true,
          statPct: {
            spd: 0.35,
            atk: 0.1
          },
          effect: {
            evasion: 0.15
          },
          awaken: {
            effect: {
              critChance: 0.05
            }
          }
        },
        SIG_ABYSS_SHADOW: {
          id: 'SIG_ABYSS_SHADOW',
          label: '심연의 그림자',
          desc: '속도+공격+치명+회피+팀공격(초월 암살)',
          signature: true,
          statPct: {
            spd: 0.4,
            atk: 0.15
          },
          effect: {
            critChance: 0.28,
            critDamage: 0.5,
            evasion: 0.15
          },
          teamBuff: {
            atk: 0.08
          },
          awaken: {
            effect: {
              defPierce: 0.1
            }
          }
        },
        SIG_ARCHER_NOVICE: {
          id: 'SIG_ARCHER_NOVICE',
          label: '견습 사냥술',
          desc: '공격 강화(궁수 입문)',
          signature: true,
          statPct: {
            atk: 0.12
          },
          awaken: {
            effect: {
              critChance: 0.03
            }
          }
        },
        SIG_MOONLIGHT_SHOT: {
          id: 'SIG_MOONLIGHT_SHOT',
          label: '달빛 사격',
          desc: '공격+치명+명중(정조준)',
          signature: true,
          statPct: {
            atk: 0.16
          },
          effect: {
            critChance: 0.18,
            accuracy: 0.1
          },
          awaken: {
            effect: {
              critDamage: 0.1
            }
          }
        },
        SIG_CELESTIAL_ARROW: {
          id: 'SIG_CELESTIAL_ARROW',
          label: '천공의 화살',
          desc: '공격+치명+관통+명중+팀치명(초월 저격)',
          signature: true,
          statPct: {
            atk: 0.22
          },
          effect: {
            critChance: 0.25,
            defPierce: 0.18,
            accuracy: 0.15
          },
          teamBuff: {
            critChance: 0.08
          },
          awaken: {
            effect: {
              critDamage: 0.18
            }
          }
        },
        SIG_MAGE_NOVICE: {
          id: 'SIG_MAGE_NOVICE',
          label: '견습 마법',
          desc: '공격 강화(법사 입문)',
          signature: true,
          statPct: {
            atk: 0.14
          },
          awaken: {
            effect: {
              critDamage: 0.05
            }
          }
        },
        SIG_FROST_NOVA: {
          id: 'SIG_FROST_NOVA',
          label: '서리 폭발',
          desc: '공격+치명피해+절대공격(빙결 마법)',
          signature: true,
          statPct: {
            atk: 0.17
          },
          effect: {
            critDamage: 0.35,
            trueDamage: 0.08
          },
          awaken: {
            effect: {
              critChance: 0.05
            }
          }
        },
        SIG_VOID_SURGE: {
          id: 'SIG_VOID_SURGE',
          label: '공허의 쇄도',
          desc: '공격+치명+절대공격(금단 마법)',
          signature: true,
          statPct: {
            atk: 0.2
          },
          effect: {
            critChance: 0.22,
            critDamage: 0.5,
            trueDamage: 0.1
          },
          awaken: {
            effect: {
              defPierce: 0.1
            }
          }
        }
      });

      // 시그니처 각성 상한 + 비용 (같은 캐릭터 조각=소환 재화 + 프리미엄).
      var AWAKEN_MAX = exports('AWAKEN_MAX', 3);
      function awakenCost(level) {
        return {
          summon: 30 * (level + 1),
          gem: 10 * (level + 1)
        };
      }
      function getSkill(id) {
        var s = SKILL_CATALOG[id];
        if (!s) throw new Error("\uC54C \uC218 \uC5C6\uB294 \uC2A4\uD0AC: " + id);
        return s;
      }

      // 일반 슬롯에 장착 가능한 스킬(시그니처 제외).
      function equippableSkills() {
        return Object.values(SKILL_CATALOG).filter(function (s) {
          return !s.signature;
        });
      }

      // 스킬 슬롯 수 = 랭크에 비례 (랭크가 곧 빌드 자유도). 최대 3.
      function skillSlots(unit) {
        return Math.min(3, unit.rank + 1);
      }

      // 스킬 레벨당 효과 배수. Lv1=1.0, Lv2=1.15 ...
      function skillPower(skillLevel) {
        return 1 + (skillLevel - 1) * 0.15;
      }

      // 스킬 레벨업(강화) 비용 — 소환 재화와 성장 재화 소모.
      function skillUpCost(skillLevel) {
        return {
          growth: Math.round(30 * Math.pow(1.3, skillLevel - 1))
        };
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/spriteAnim.ts", ['cc'], function (exports) {
  var cclegacy;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }],
    execute: function () {
      exports({
        frameAt: frameAt,
        frameCount: frameCount,
        frameOffsetX: frameOffsetX,
        isPlaybackDone: isPlaybackDone,
        stateSpec: stateSpec
      });
      cclegacy._RF.push({}, "87386gwhL5DgYrv52waqAwK", "spriteAnim", undefined);
      // ─────────────────────────────────────────────────────────────
      // 스프라이트 시트 프레임 애니메이션 — 순수 계산(장르/UI 무관).
      //   3D→2D 프리렌더(경로 Y) 스프라이트를 RN/웹 컴포넌트가 이 값으로 렌더한다.
      //   가로 스트립 규약: N프레임이 좌→우로 배열, 프레임 i의 x오프셋 = -i*frameW.
      //   docs/ART_PIPELINE_3D.md §3~5 참조.
      // ─────────────────────────────────────────────────────────────

      // 시트 폭 → 프레임 수(가로 스트립).
      function frameCount(sheetWidth, frameW) {
        if (!frameW || frameW <= 0) return 1;
        return Math.max(1, Math.floor(sheetWidth / frameW));
      }

      // 경과 시간(ms) → 현재 프레임 인덱스.
      //   loop=true: 순환 재생. loop=false: 마지막 프레임에서 정지(1회 재생).
      function frameAt(elapsedMs, fps, frames, loop) {
        if (loop === void 0) {
          loop = true;
        }
        if (frames <= 1 || fps <= 0) return 0;
        var idx = Math.floor(Math.max(0, elapsedMs) / (1000 / fps));
        return loop ? idx % frames : Math.min(idx, frames - 1);
      }

      // 프레임 인덱스 → 배경 x오프셋(px). 음수(왼쪽으로 이동).
      function frameOffsetX(frameIndex, frameW) {
        return frameIndex ? -frameIndex * frameW : 0; // 0에서 -0 방지
      }

      // 1회 재생 상태가 끝났는지(공격/피격/사망 전환 판정용).
      function isPlaybackDone(elapsedMs, fps, frames) {
        if (frames <= 1 || fps <= 0) return true;
        return elapsedMs >= frames / fps * 1000;
      }

      // 전투 상태별 재생 규약(기본값). fps·순환 여부.
      // 16프레임 기준 fps — 8프레임 대비 재생 시간은 같게 유지하며 부드러움만 2배.
      // fps를 낮춰 "느리게"를 노렸었지만, 프레임 수(16장)가 고정이라 fps를 낮추면
      //   프레임당 노출 시간만 늘어 오히려 뚝뚝 끊겨 보인다(부드러움 ≠ 느림).
      //   부드러움은 fps로, 체감 속도는 BattleView의 공격/반격 간격(틱 분주기)으로 분리해 조절한다.
      var SPRITE_STATES = exports('SPRITE_STATES', {
        idle: {
          loop: true,
          fps: 20
        },
        attack: {
          loop: false,
          fps: 28
        },
        hit: {
          loop: false,
          fps: 24
        },
        walk: {
          loop: false,
          fps: 20
        },
        // 한 걸음 사이클 1회(웨이브 전진 연출)
        // 돌격 루틴(run→jump→attack)용. 이동 연출과 함께 재생되므로 제자리걸음으로 보이지 않는다.
        run: {
          loop: false,
          fps: 22
        },
        jump: {
          loop: false,
          fps: 18
        },
        death: {
          loop: false,
          fps: 20
        },
        spawn: {
          loop: false,
          fps: 24
        }
      });

      // 상태 정의 조회(미정의 상태는 idle 규약으로 폴백).
      function stateSpec(state) {
        return SPRITE_STATES[state] || SPRITE_STATES.idle;
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/starGrade.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './economy.ts'], function (exports) {
  var _createForOfIteratorHelperLoose, cclegacy, spend;
  return {
    setters: [function (module) {
      _createForOfIteratorHelperLoose = module.createForOfIteratorHelperLoose;
    }, function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      spend = module.spend;
    }],
    execute: function () {
      exports({
        availableDupes: availableDupes,
        starLabel: starLabel,
        starMult: starMult,
        starOf: starOf,
        starUp: starUp,
        starUpInfo: starUpInfo,
        starUpReq: starUpReq
      });
      cclegacy._RF.push({}, "c03dcpbDNVI7ImHZAdniqY6", "starGrade", undefined);

      // ─────────────────────────────────────────────────────────────
      // 성급(Star Grade) — 동일 영웅 "중복"을 합쳐 별을 올려 능력치를 끌어올린다.
      //   · 방치·수집형 표준(세나키우기식 "합성/성급"): 뽑을수록 쌓이는 중복이
      //     사장되지 않고 성장 축으로 환원된다.
      //   · 성급은 모든 스탯에 곱연산 배수(+12%/성급). 레벨/랭크와 독립 축.
      //   · 상승 비용 = 같은 캐릭터 중복 인스턴스 N개(+골드). 파티/대상은 보호.
      //   · 소모되는 중복의 장비·룬은 인벤토리로 회수(손실 없음).
      //
      // 저장 필드: unit.star (1~STAR_MAX). 누락 시 1로 간주(하위호환).
      // ─────────────────────────────────────────────────────────────

      // 성급 10단계: 1~5성(일반 별)·6~10성(태양 별). 배지는 5조각 단위로 채워지며
      // 6성부터 별 모양이 태양으로 바뀐다(components.js StarBadge 참조).
      var STAR_MAX = exports('STAR_MAX', 10);
      var STAR_STAT_PER = 0.12; // 성급당 +12% (곱연산). 10성 = ×2.08

      // S성 → (S+1)성 골드 비용(고정 표). 중복이 실질 관문, 골드는 보조 소모.
      var STAR_GOLD = {
        1: 20000,
        2: 60000,
        3: 150000,
        4: 400000,
        5: 1000000,
        6: 2500000,
        7: 6000000,
        8: 15000000,
        9: 35000000
      };
      function starOf(unit) {
        return unit.star || 1;
      }

      // 성급 스탯 배수 — stats.baseGrownStats가 곱한다.
      function starMult(unit) {
        return 1 + (starOf(unit) - 1) * STAR_STAT_PER;
      }

      // 별 표시 문자열(★ 채움 / ☆ 빈칸).
      function starLabel(unit) {
        var s = starOf(unit);
        return '★'.repeat(s) + '☆'.repeat(STAR_MAX - s);
      }

      // S성에서 다음 성급으로 올리는 요구치.
      function starUpReq(star) {
        return {
          dupes: star,
          currency: STAR_GOLD[star] || 0
        };
      }

      // 소비 가능한 중복 인스턴스 — 같은 캐릭터, 대상/파티 제외, 약한 순(투자 적은 것부터).
      //   proxy 정렬(rank·level)로 stats 순환 의존을 피한다.
      function availableDupes(state, unit) {
        if (!unit || !unit.characterId) return [];
        return (state.units || []).filter(function (u) {
          return u.uid !== unit.uid && u.characterId === unit.characterId && !state.party.includes(u.uid);
        }).sort(function (a, b) {
          return (a.rank || 1) * 1000 + (a.level || 1) - ((b.rank || 1) * 1000 + (b.level || 1));
        });
      }

      // 성급 강화 가능 여부 요약(UI/판정 공용).
      function starUpInfo(state, unit) {
        var star = starOf(unit);
        var maxed = star >= STAR_MAX;
        var identified = !!unit.characterId;
        var req = maxed ? null : starUpReq(star);
        var dupes = availableDupes(state, unit);
        var haveDupes = dupes.length;
        var enoughDupes = !maxed && haveDupes >= ((req == null ? void 0 : req.dupes) || 0);
        var enoughGold = !maxed && (state.wallet.currency || 0) >= ((req == null ? void 0 : req.currency) || 0);
        return {
          star: star,
          maxed: maxed,
          identified: identified,
          req: req,
          haveDupes: haveDupes,
          enoughDupes: enoughDupes,
          enoughGold: enoughGold,
          canUp: !maxed && identified && enoughDupes && enoughGold
        };
      }

      // 성급 강화 실행 — 중복 소모(장비·룬 회수) + 골드 소모, 별 +1.
      function starUp(state, uid) {
        var unit = (state.units || []).find(function (u) {
          return u.uid === uid;
        });
        if (!unit) return {
          ok: false,
          reason: '유닛 없음'
        };
        var star = starOf(unit);
        if (star >= STAR_MAX) return {
          ok: false,
          reason: "\uCD5C\uACE0 \uC131\uAE09 " + STAR_MAX + "\u2605"
        };
        if (!unit.characterId) return {
          ok: false,
          reason: '정체성 없는 유닛은 성급 강화 불가'
        };
        var req = starUpReq(star);
        var dupes = availableDupes(state, unit);
        if (dupes.length < req.dupes) {
          return {
            ok: false,
            reason: "\uC911\uBCF5 \uC601\uC6C5 " + req.dupes + "\uBA85 \uD544\uC694 (\uBCF4\uC720 " + dupes.length + ")",
            req: req
          };
        }
        if ((state.wallet.currency || 0) < req.currency) {
          return {
            ok: false,
            reason: '골드 부족',
            req: req
          };
        }
        spend(state.wallet, {
          currency: req.currency
        });
        var consume = dupes.slice(0, req.dupes);
        var cset = new Set(consume.map(function (u) {
          return u.uid;
        }));
        // 소모 유닛의 장비·룬 회수(손실 방지).
        state.inventory = state.inventory || [];
        state.runeBag = state.runeBag || [];
        for (var _iterator = _createForOfIteratorHelperLoose(consume), _step; !(_step = _iterator()).done;) {
          var u = _step.value;
          for (var _i = 0, _Object$keys = Object.keys(u.gear || {}); _i < _Object$keys.length; _i++) {
            var slot = _Object$keys[_i];
            var it = u.gear[slot];
            if (it) state.inventory.push(it);
          }
          for (var _iterator2 = _createForOfIteratorHelperLoose(u.runes || []), _step2; !(_step2 = _iterator2()).done;) {
            var r = _step2.value;
            if (r) state.runeBag.push(r);
          }
          if (state.profile && state.profile.avatarUid === u.uid) state.profile.avatarUid = null;
        }
        state.units = state.units.filter(function (u) {
          return !cset.has(u.uid);
        });
        unit.star = star + 1;
        return {
          ok: true,
          star: unit.star,
          consumed: consume.length,
          req: req
        };
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/stats.ts", ['cc', './archetypes.ts', './modifiers.ts', './balance.ts', './seed.ts', './starGrade.ts'], function (exports) {
  var cclegacy, getArchetype, collectUnitModifiers, BALANCE, rarityBaseMult, starMult;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      getArchetype = module.getArchetype;
    }, function (module) {
      collectUnitModifiers = module.collectUnitModifiers;
    }, function (module) {
      BALANCE = module.BALANCE;
    }, function (module) {
      rarityBaseMult = module.rarityBaseMult;
    }, function (module) {
      starMult = module.starMult;
    }],
    execute: function () {
      exports({
        computePower: computePower,
        computeStats: computeStats,
        powerBreakdown: powerBreakdown
      });
      cclegacy._RF.push({}, "be145sKfz5FAKeVvL+tQy6Q", "stats", undefined);

      // ─────────────────────────────────────────────────────────────
      // 스탯 성장 공식 — 장르/컨셉 무관.
      // 계산 순서:
      //   1) 기본스탯 × 레벨배수 × 랭크배수   (원형 성장)
      //   2) × (1 + 강화·스킬의 statPct)       (방향성 성장)
      //   3) + 장비의 statFlat                 (착용 성장)
      //
      //   레벨: 스탯 +8%/레벨 (곱연산)
      //   랭크: 스탯 +25%/랭크 (곱연산)
      //   속도(spd): 성장 완만 +1%/레벨
      // ─────────────────────────────────────────────────────────────

      // 성장 요소를 반영하지 않은 "원형 성장"만 계산.
      function baseGrownStats(unit) {
        var _getArchetype = getArchetype(unit.archetype),
          base = _getArchetype.base;
        var levelMult = 1 + (unit.level - 1) * BALANCE.statPerLevel;
        var rankMult = 1 + (unit.rank - 1) * BALANCE.statPerRank;
        var growth = levelMult * rankMult;
        var spdMult = 1 + (unit.level - 1) * BALANCE.spdPerLevel;
        // 등급 기본 배수 — 등급이 곧 잠재력의 하한(씨앗이 좁히되 다 못 메움).
        // 등급 없는 유닛(데모/시뮬)은 1.0 → 하위호환.
        var rm = rarityBaseMult(unit);
        // 성급 배수 — 동일 영웅 중복 합성으로 오르는 독립 성장 축(+12%/성급).
        var sm = starMult(unit);
        return {
          hp: base.hp * growth * rm * sm,
          atk: base.atk * growth * rm * sm,
          def: base.def * growth * rm * sm,
          spd: base.spd * spdMult * rm * sm
        };
      }

      // 원형 스탯 + 모디파이어 → 최종 스탯 (내부 공용).
      function statsFrom(g, mods) {
        return {
          hp: Math.round(g.hp * (1 + mods.statPct.hp) + mods.statFlat.hp),
          atk: Math.round(g.atk * (1 + mods.statPct.atk) + mods.statFlat.atk),
          def: Math.round(g.def * (1 + mods.statPct.def) + mods.statFlat.def),
          spd: Math.round(g.spd * (1 + mods.statPct.spd) + mods.statFlat.spd)
        };
      }

      // 스킬·강화까지 반영한 최종 스탯.
      function computeStats(unit) {
        return statsFrom(baseGrownStats(unit), collectUnitModifiers(unit));
      }

      // 스탯·효과별 전투력 기여를 분해해 반환(브리핑·표시·정렬 공용).
      //   { stats:{hp,atk,def,spd}, effects:{...}, total }
      // 각 항목은 이미 가중치를 곱한 "전투력 점수"다 → 합이 곧 전투력.
      function powerBreakdown(unit) {
        var mods = collectUnitModifiers(unit);
        var s = statsFrom(baseGrownStats(unit), mods);
        var w = BALANCE.powerWeights;
        var stats = {
          hp: s.hp * w.hp,
          atk: s.atk * w.atk,
          def: s.def * w.def,
          spd: s.spd * w.spd
        };
        var effects = {};
        var ew = BALANCE.powerEffectWeights || {};
        for (var _i = 0, _Object$keys = Object.keys(ew); _i < _Object$keys.length; _i++) {
          var k = _Object$keys[_i];
          effects[k] = (mods.effect[k] || 0) * ew[k];
        }
        var total = Object.values(stats).reduce(function (a, b) {
          return a + b;
        }, 0) + Object.values(effects).reduce(function (a, b) {
          return a + b;
        }, 0);
        return {
          stats: stats,
          effects: effects,
          total: Math.round(total),
          rawStats: s,
          rawEffects: mods.effect
        };
      }

      // 표시용 단일 전투력 지표(밸런싱/정렬용). 판정 자체는 stats로 한다.
      function computePower(unit) {
        return powerBreakdown(unit).total;
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/summon.ts", ['cc', './economy.ts', './gear.ts', './runes.ts', './costumes.ts'], function (exports) {
  var cclegacy, spend, earn, dropGear, GEAR_CATALOG, dropRune, summonCostumePool, grantCostume;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      spend = module.spend;
      earn = module.earn;
    }, function (module) {
      dropGear = module.dropGear;
      GEAR_CATALOG = module.GEAR_CATALOG;
    }, function (module) {
      dropRune = module.dropRune;
    }, function (module) {
      summonCostumePool = module.summonCostumePool;
      grantCostume = module.grantCostume;
    }],
    execute: function () {
      exports({
        summonCosmetic: summonCosmetic,
        summonGear: summonGear,
        summonRune: summonRune
      });
      cclegacy._RF.push({}, "30efcBV+a9OF58GYzb+lO4F", "summon", undefined);

      // ─────────────────────────────────────────────────────────────
      // 통합 소환 — 영웅 외 자원도 "뽑기"로 제공하는 파밍 경로.
      //   · 장비 소환 : 랜덤 장비 → 인벤토리 (dropGear 재사용)
      //   · 룬 소환   : 랜덤 룬 → 룬 가방   (dropRune 재사용)
      //   · 코스튬 소환: 미보유 프로필 외형(프레임/칭호) 지급, 전부 보유 시 환급
      // 진행도(peakStage)가 상위 등급 확률(luck)을 끌어올린다(던전과 동일 규약).
      // 펫 소환은 pets.mjs(petSummon), 영웅 소환은 gacha.mjs가 담당.
      // ─────────────────────────────────────────────────────────────

      var GEAR_PULL_COST = exports('GEAR_PULL_COST', {
        gem: 20
      });
      var RUNE_PULL_COST = exports('RUNE_PULL_COST', {
        gem: 20
      });
      var COSTUME_PULL_COST = exports('COSTUME_PULL_COST', {
        gem: 50
      });
      var COSTUME_DUP_REFUND = exports('COSTUME_DUP_REFUND', {
        gem: 25
      });
      function luckOf(state) {
        return Math.min(1, (state.peakStage || 1) / 200);
      }
      function summonGear(state, rng) {
        if (rng === void 0) {
          rng = Math.random;
        }
        if (!spend(state.wallet, GEAR_PULL_COST)) return {
          ok: false,
          reason: '다이아 부족',
          cost: GEAR_PULL_COST
        };
        var r = dropGear(state, rng, luckOf(state));
        return {
          ok: true,
          kind: 'gear',
          item: r.item,
          rarity: r.rarity,
          label: GEAR_CATALOG[r.item.blueprint].label
        };
      }
      function summonRune(state, rng) {
        if (rng === void 0) {
          rng = Math.random;
        }
        if (!spend(state.wallet, RUNE_PULL_COST)) return {
          ok: false,
          reason: '다이아 부족',
          cost: RUNE_PULL_COST
        };
        var r = dropRune(state, rng, luckOf(state));
        return {
          ok: true,
          kind: 'rune',
          rune: r.rune,
          rarity: r.rarity
        };
      }

      // 코스튬(캐릭터 스킨) 소환 — 미보유 소환 코스튬 무작위 지급. 전부 보유 시 다이아 일부 환급.
      function summonCosmetic(state, rng) {
        if (rng === void 0) {
          rng = Math.random;
        }
        if (!spend(state.wallet, COSTUME_PULL_COST)) return {
          ok: false,
          reason: '다이아 부족',
          cost: COSTUME_PULL_COST
        };
        var pool = summonCostumePool(state);
        if (!pool.length) {
          earn(state.wallet, COSTUME_DUP_REFUND);
          return {
            ok: true,
            kind: 'costume',
            duplicate: true,
            refund: COSTUME_DUP_REFUND
          };
        }
        var pick = pool[Math.floor(rng() * pool.length)];
        grantCostume(state, pick.id);
        return {
          ok: true,
          kind: 'costume',
          item: {
            id: pick.id,
            label: pick.label,
            emoji: pick.emoji,
            rarity: pick.rarity
          }
        };
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/summonMastery.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './economy.ts', './progression.ts'], function (exports) {
  var _extends, _createForOfIteratorHelperLoose, cclegacy, earn, getStage;
  return {
    setters: [function (module) {
      _extends = module.extends;
      _createForOfIteratorHelperLoose = module.createForOfIteratorHelperLoose;
    }, function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      earn = module.earn;
    }, function (module) {
      getStage = module.getStage;
    }],
    execute: function () {
      exports({
        claimAllSummonLevels: claimAllSummonLevels,
        claimSummonLevel: claimSummonLevel,
        levelForCount: levelForCount,
        levelPowerBonus: levelPowerBonus,
        levelReward: levelReward,
        recordSummon: recordSummon,
        summonMasteryInfo: summonMasteryInfo,
        summonMasteryPower: summonMasteryPower
      });
      cclegacy._RF.push({}, "b1718e+hcZNKYazeBTOGBwM", "summonMastery", undefined);

      // ─────────────────────────────────────────────────────────────
      // 소환 숙련도(소환 레벨) — 배너별로 소환할수록 레벨이 오르고, 달성 보상을 청구.
      //   · 배너: hero · pet · gear · rune · cosmetic (소환 탭 항목들)
      //   · 최대 15레벨. 누적 소환 횟수가 문턱을 넘으면 그 레벨이 열린다.
      //   · 홀수 레벨 : 뽑기권 + 능력치 보상(계정 파워 %) — 전투력에 영구 반영
      //   · 짝수 레벨 : 뽑기권 + 재화(진행도 비례 골드·정수·다이아)
      //   보상은 순차 청구(낮은 레벨부터). 파워 보너스는 청구한 홀수 레벨에서 파생.
      // ─────────────────────────────────────────────────────────────

      var SUMMON_LEVEL_MAX = exports('SUMMON_LEVEL_MAX', 15);
      var SUMMON_BANNERS = exports('SUMMON_BANNERS', ['hero', 'pet', 'gear', 'rune', 'cosmetic', 'guardian']);

      // 레벨 L 도달에 필요한 누적 소환 횟수 (index 0 = 레벨1).
      var SUMMON_LEVEL_THRESHOLDS = exports('SUMMON_LEVEL_THRESHOLDS', [3, 8, 15, 25, 40, 60, 85, 115, 150, 190, 235, 285, 340, 400, 465]);

      // 홀수 레벨의 능력치 보상 = 계정 파워 배수 증가분. (1→+1% … 15→+8%)
      function levelPowerBonus(level) {
        return level % 2 === 1 ? 0.01 * Math.ceil(level / 2) : 0;
      }

      // 누적 횟수 → 도달 레벨(0~15).
      function levelForCount(count) {
        var lv = 0;
        for (var i = 0; i < SUMMON_LEVEL_THRESHOLDS.length; i++) {
          if (count >= SUMMON_LEVEL_THRESHOLDS[i]) lv = i + 1;else break;
        }
        return lv;
      }
      function ensure(state, banner) {
        state.summonMastery = state.summonMastery || {};
        state.summonMastery[banner] = state.summonMastery[banner] || {
          count: 0,
          claimed: 0
        };
        return state.summonMastery[banner];
      }

      // 소환 실행 시 호출 — 해당 배너 누적 횟수 증가.
      function recordSummon(state, banner, n) {
        if (n === void 0) {
          n = 1;
        }
        if (!SUMMON_BANNERS.includes(banner)) return;
        var m = ensure(state, banner);
        m.count += n;
      }

      // 레벨 보상 정의 (표시·지급 공용). 모든 배너 공통 기본보상 = 소환권 + 다이아.
      //   · 홀수 : 기본(소환권+다이아) + 능력치(계정 파워 %)
      //   · 짝수 : 기본(소환권+다이아) + 재화(골드·정수, 진행도 비례)
      function levelReward(state, banner, level) {
        var base = {
          summon: 10 + level * 2,
          gem: 6 + level * 2
        };
        if (level % 2 === 1) {
          return _extends({
            type: 'stat'
          }, base, {
            power: levelPowerBonus(level)
          });
        }
        var st = getStage(state.peakStage || 1).rewards;
        var scale = 30 + level * 10;
        return _extends({
          type: 'currency'
        }, base, {
          currency: Math.round(st.currency * scale),
          growth: Math.round(st.growth * scale)
        });
      }

      // 배너 현황 (UI 공용): 누적·레벨·청구가능 여부·다음 문턱.
      function summonMasteryInfo(state, banner) {
        var m = ensure(state, banner);
        var level = levelForCount(m.count);
        var claimable = level > m.claimed; // 도달했으나 미청구 레벨 존재
        var nextLevel = Math.min(SUMMON_LEVEL_MAX, m.claimed + 1);
        var nextThreshold = m.claimed < SUMMON_LEVEL_MAX ? SUMMON_LEVEL_THRESHOLDS[m.claimed] : null;
        return {
          banner: banner,
          count: m.count,
          level: level,
          claimed: m.claimed,
          claimable: claimable,
          maxed: m.claimed >= SUMMON_LEVEL_MAX,
          nextLevel: nextLevel,
          nextThreshold: nextThreshold,
          nextReward: m.claimed < SUMMON_LEVEL_MAX ? levelReward(state, banner, m.claimed + 1) : null
        };
      }

      // 다음 미청구 레벨 하나를 청구(순차). 도달하지 못했으면 실패.
      function claimSummonLevel(state, banner) {
        var m = ensure(state, banner);
        var level = levelForCount(m.count);
        if (m.claimed >= SUMMON_LEVEL_MAX) return {
          ok: false,
          reason: '최대 레벨'
        };
        if (level <= m.claimed) return {
          ok: false,
          reason: '레벨 미달'
        };
        var next = m.claimed + 1;
        var reward = levelReward(state, banner, next);
        var grant = {};
        for (var _i = 0, _arr = ['summon', 'gem', 'currency', 'growth']; _i < _arr.length; _i++) {
          var k = _arr[_i];
          if (reward[k]) grant[k] = reward[k];
        }
        earn(state.wallet, grant);
        m.claimed = next;
        return {
          ok: true,
          level: next,
          reward: reward
        };
      }

      // 모든 배너의 청구 가능 레벨을 한 번에 청구(편의).
      function claimAllSummonLevels(state) {
        var claimed = [];
        for (var _iterator = _createForOfIteratorHelperLoose(SUMMON_BANNERS), _step; !(_step = _iterator()).done;) {
          var banner = _step.value;
          var r = void 0;
          while ((r = claimSummonLevel(state, banner)).ok) claimed.push(_extends({
            banner: banner
          }, r));
        }
        return {
          ok: claimed.length > 0,
          claimed: claimed
        };
      }

      // 청구한 홀수 레벨들의 능력치 보상 합 → 계정 파워 배수(1 + Σ).
      function summonMasteryPower(state) {
        if (!state.summonMastery) return 1;
        var bonus = 0;
        for (var _iterator2 = _createForOfIteratorHelperLoose(SUMMON_BANNERS), _step2; !(_step2 = _iterator2()).done;) {
          var banner = _step2.value;
          var m = state.summonMastery[banner];
          if (!m) continue;
          for (var lv = 1; lv <= m.claimed; lv++) bonus += levelPowerBonus(lv);
        }
        return 1 + bonus;
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/synergy.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './features.ts'], function (exports) {
  var _createForOfIteratorHelperLoose, cclegacy, isOn;
  return {
    setters: [function (module) {
      _createForOfIteratorHelperLoose = module.createForOfIteratorHelperLoose;
    }, function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      isOn = module.isOn;
    }],
    execute: function () {
      exports('teamSynergy', teamSynergy);
      cclegacy._RF.push({}, "fe72bUiymZApbnIMRkouQP1", "synergy", undefined);
      var CATEGORY = {
        VANGUARD: 'defense',
        STRIKER: 'attack',
        ROGUE: 'attack',
        ARCHER: 'attack',
        MAGE: 'attack',
        SUPPORT: 'support'
      };
      function teamSynergy(units) {
        var mult = {
          atk: 1,
          hp: 1,
          def: 1
        };
        var list = [];
        var add = function add(id, label, desc, m) {
          mult.atk *= m.atk || 1;
          mult.hp *= m.hp || 1;
          mult.def *= m.def || 1;
          list.push({
            id: id,
            label: label,
            desc: desc
          });
        };
        if (!units || units.length === 0) return {
          mult: mult,
          list: list
        };
        var arch = {};
        var elem = {};
        var cat = {};
        for (var _iterator = _createForOfIteratorHelperLoose(units), _step; !(_step = _iterator()).done;) {
          var u = _step.value;
          arch[u.archetype] = (arch[u.archetype] || 0) + 1;
          cat[CATEGORY[u.archetype]] = (cat[CATEGORY[u.archetype]] || 0) + 1;
          if (u.element) elem[u.element] = (elem[u.element] || 0) + 1;
        }

        // 삼위일체 — 방어·공격(딜러 계열 전체)·지원 카테고리 모두 충족
        if (cat.defense && cat.attack && cat.support) {
          add('trinity', '삼위일체', '방어·공격·지원 편성 · 전 스탯 +12%', {
            atk: 1.12,
            hp: 1.12,
            def: 1.12
          });
        }
        // 원형 진형 — 같은 원형 3+ (6원형 각각 고유 보너스)
        if ((arch.STRIKER || 0) >= 3) add('str_focus', '공격 진형', '전사 3+ · 공격 +18%', {
          atk: 1.18
        });
        if ((arch.VANGUARD || 0) >= 3) add('van_focus', '철벽 진형', '수호 3+ · 체력 +20% 방어 +15%', {
          hp: 1.20,
          def: 1.15
        });
        if ((arch.SUPPORT || 0) >= 3) add('sup_focus', '지휘 진형', '지원 3+ · 공격 +12%', {
          atk: 1.12
        });
        if ((arch.ROGUE || 0) >= 3) add('rogue_focus', '기습 진형', '도적 3+ · 공격 +16%', {
          atk: 1.16
        });
        if ((arch.ARCHER || 0) >= 3) add('archer_focus', '저격 진형', '궁수 3+ · 공격 +14%', {
          atk: 1.14
        });
        if ((arch.MAGE || 0) >= 3) add('mage_focus', '비전 진형', '법사 3+ · 공격 +20%', {
          atk: 1.20
        });

        // 속성 결속·오색 — 속성 옵션이 켜져 있을 때만
        if (isOn('elements')) {
          // 속성 결속 — 같은 속성 최대 그룹 크기에 비례
          var maxElem = Math.max.apply(Math, [0].concat(Object.values(elem)));
          if (maxElem >= 2) {
            var m = maxElem >= 4 ? 1.22 : maxElem >= 3 ? 1.15 : 1.08;
            add('elem_bond', '속성 결속', "\uB3D9\uC77C \uC18D\uC131 " + maxElem + " \xB7 \uACF5\uACA9 +" + Math.round((m - 1) * 100) + "%", {
              atk: m
            });
          }
          // 오색 결속 — 전원(3+) 서로 다른 속성
          var withElem = units.filter(function (u) {
            return u.element;
          }).length;
          if (withElem >= 3 && Object.keys(elem).length === withElem) {
            add('rainbow', '오색 결속', '전원 다른 속성 · 공격·체력 +10%', {
              atk: 1.10,
              hp: 1.10
            });
          }
        }
        return {
          mult: mult,
          list: list
        };
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/tower.ts", ['cc', './progression.ts', './resolution.ts', './gameState.ts', './balance.ts', './economy.ts'], function (exports) {
  var cclegacy, getStage, resolve, getPartyUnits, accountMods, earn;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      getStage = module.getStage;
    }, function (module) {
      resolve = module.resolve;
    }, function (module) {
      getPartyUnits = module.getPartyUnits;
    }, function (module) {
      accountMods = module.accountMods;
    }, function (module) {
      earn = module.earn;
    }],
    execute: function () {
      exports({
        climbTower: climbTower,
        towerChallenge: towerChallenge,
        towerReward: towerReward
      });
      cclegacy._RF.push({}, "de73eEm84JP4IVNR/MIhiyo", "tower", undefined);

      // ─────────────────────────────────────────────────────────────
      // 무한의 탑 — 끝없이 오르는 엔드게임 도전.
      //   · 각 층은 점점 강해지는 보스(같은 resolve 엔진). 승리 시 다음 층.
      //   · 패배하면 그 층에 머문다(벽) → 성장·계정 배수로 재도전.
      //   · 5층마다 마일스톤 보상. 최고 층(best)이 실력 지표.
      // 상태: state.tower = { floor, best }.
      // ─────────────────────────────────────────────────────────────

      // 층 난이도 — 일반 스테이지보다 가파르게(엔드게임). 보스 강화 포함.
      function towerChallenge(floor) {
        var c = getStage(4 + floor * 3).challenge;
        return {
          hp: Math.round(c.hp * 1.5),
          atk: Math.round(c.atk * 1.2),
          def: Math.round(c.def * 1.15),
          element: c.element
        };
      }

      // 층이 깊을수록 보상↑. 5층 마일스톤은 소환권까지.
      function towerReward(floor) {
        if (floor % 5 === 0) return {
          gem: 10 + floor,
          summon: 15 + Math.floor(floor / 2)
        };
        return {
          gem: 1 + Math.floor(floor / 3)
        };
      }

      // 현재 층 도전. 승리 시 보상 + 전진.
      function climbTower(state) {
        var floor = state.tower && state.tower.floor || 1;
        var party = getPartyUnits(state);
        if (!party.length) return {
          ok: false,
          reason: '파티 없음'
        };
        var res = resolve(party, towerChallenge(floor), accountMods(state), state.formation);
        if (!res.win) return {
          ok: true,
          win: false,
          floor: floor,
          margin: res.margin
        };
        var reward = towerReward(floor);
        earn(state.wallet, reward);
        state.tower.floor = floor + 1;
        state.tower.best = Math.max(state.tower.best || 1, state.tower.floor);
        return {
          ok: true,
          win: true,
          floor: floor,
          reward: reward,
          next: state.tower.floor,
          milestone: floor % 5 === 0
        };
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/tutorial.ts", ['cc', './unlocks.ts', './gameState.ts'], function (exports) {
  var cclegacy, isUnlocked, unlockStage, MAX_PARTY;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      isUnlocked = module.isUnlocked;
      unlockStage = module.unlockStage;
    }, function (module) {
      MAX_PARTY = module.MAX_PARTY;
    }],
    execute: function () {
      exports('nextObjective', nextObjective);
      cclegacy._RF.push({}, "32141e/IbBJXoqig1I1yvIL", "tutorial", undefined);

      // ─────────────────────────────────────────────────────────────
      // 온보딩 목표 — 다음에 뭘 해야 하는지 state에서 유도한다(코치마크 대신 목표 배너).
      // 핵심 루프를 순서대로 가르친다: 레벨업 → 소환 해금 → 팀 구성.
      // id는 Concept가 현지화 텍스트를 붙이고, tab은 이동 안내에 쓴다.
      // null 반환 = 온보딩 완료(배너 숨김).
      // ─────────────────────────────────────────────────────────────

      function nextObjective(state) {
        var units = state.units || [];
        var gachaOpen = isUnlocked(state, 'gacha');

        // 1) 아직 팀 없음 + 소환 미해금 → 레벨업으로 강해져 소환 해금 스테이지 도달
        if (units.length <= 1 && !gachaOpen) {
          return {
            id: 'level',
            tab: 'roster',
            target: unlockStage('gacha')
          };
        }
        // 2) 소환 열림 + 아직 혼자 → 소환으로 파티원 확보
        if (gachaOpen && units.length <= 1) {
          return {
            id: 'summon',
            tab: 'gacha'
          };
        }
        // 3) 유닛 2+ 인데 편성이 1명 → 파티 편성
        if (units.length >= 2 && (state.party || []).length < Math.min(2, MAX_PARTY)) {
          return {
            id: 'party',
            tab: 'roster'
          };
        }
        // ── 중반 힌트: 신규 시스템 발견성 (해금됐지만 아직 안 쓴 경우 1회성 안내) ──
        // 4) 환생 가능한데 미실행 → 영구 성장 안내
        if ((state.maxStage || 1) >= 15 && (state.prestige || 0) === 0) {
          return {
            id: 'prestige',
            tab: 'idle'
          };
        }
        // 5) 파티 2+ · 진형 미설정 → 전열/후열 전략 안내
        var formationSet = state.formation && Object.keys(state.formation).length > 0;
        if ((state.party || []).length >= 2 && !formationSet && (state.peakStage || 1) >= 20) {
          return {
            id: 'formation',
            tab: 'roster'
          };
        }
        // 6) 아레나 열림 · 한 번도 대전 안 함 → 전투력 리그 안내
        var ladderPts = state.ladders && Object.values(state.ladders).some(function (l) {
          return (l && l.points) > 0;
        });
        if (isUnlocked(state, 'arena') && (state.arena && state.arena.points || 0) === 0 && !ladderPts) {
          return {
            id: 'arena',
            tab: 'arena'
          };
        }
        // 7) 완료
        return null;
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/units.ts", ['cc', './archetypes.ts', './stats.ts', './modifiers.ts', './enhance.ts', './gear.ts', './balance.ts'], function (exports) {
  var cclegacy, getArchetype, computeStats, collectUnitModifiers, createEnhance, emptyGearSet, BALANCE;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      getArchetype = module.getArchetype;
    }, function (module) {
      computeStats = module.computeStats;
    }, function (module) {
      collectUnitModifiers = module.collectUnitModifiers;
    }, function (module) {
      createEnhance = module.createEnhance;
    }, function (module) {
      emptyGearSet = module.emptyGearSet;
    }, function (module) {
      BALANCE = module.BALANCE;
    }],
    execute: function () {
      exports({
        createUnit: createUnit,
        ensureUnitSeq: ensureUnitSeq,
        levelCap: levelCap,
        levelUpCost: levelUpCost,
        toCombatProfile: toCombatProfile
      });
      cclegacy._RF.push({}, "f7cc2yfg+xJKos8w57iUqCY", "units", undefined);

      // ─────────────────────────────────────────────────────────────
      // 유닛 인스턴스 — 시스템이 다루는 최소 단위.
      // archetype(역할) + 성장 상태(level/rank/skills/enhance).
      // "이름/외형"은 저장하지 않는다 → 그건 컨셉 레이어의 몫.
      // ─────────────────────────────────────────────────────────────

      var _seq = 0;
      // 세이브 로드 후, 기존 uid와 충돌하지 않게 시퀀스를 끌어올린다.
      function ensureUnitSeq(n) {
        if (n > _seq) _seq = n;
      }
      function createUnit(archetype, _temp) {
        var _ref = _temp === void 0 ? {} : _temp,
          _ref$level = _ref.level,
          level = _ref$level === void 0 ? 1 : _ref$level,
          _ref$rank = _ref.rank,
          rank = _ref$rank === void 0 ? 1 : _ref$rank,
          _ref$characterId = _ref.characterId,
          characterId = _ref$characterId === void 0 ? null : _ref$characterId,
          _ref$signature = _ref.signature,
          signature = _ref$signature === void 0 ? null : _ref$signature,
          _ref$element = _ref.element,
          element = _ref$element === void 0 ? null : _ref$element;
        getArchetype(archetype); // 검증
        return {
          uid: "u" + ++_seq,
          archetype: archetype,
          characterId: characterId,
          // 정체성(Concept 도감이 이름/성격을 매핑). Core는 ID만 앎.
          signature: signature,
          // 전용 스킬 id (항상 발동). null 가능.
          element: element,
          // 속성 ID (FIRE/WATER/…). null 가능.
          intimacy: 0,
          // 친밀도 포인트 (선물로 상승)
          costume: null,
          // (레거시) 컨셉 코스튬 id. null = 기본
          costumeBonus: {},
          // (레거시) 컨셉 코스튬 statPct
          skin: null,
          // 장착 코스튬(스킨) id — 순수 외형(core costumes.mjs). null = 기본
          sigWeapon: {
            level: 0
          },
          // 전용무기 (0 = 미획득)
          sigAwaken: 0,
          // 시그니처 각성 레벨
          runes: [null, null, null],
          // 룬 슬롯 (각 원소는 null 또는 룬 인스턴스)
          level: level,
          rank: rank,
          star: 1,
          // 성급(동일 영웅 중복 합성으로 상승) — 스탯 곱연산 축
          // 스킬 슬롯: 각 원소는 null 또는 { id, level }
          skills: [null, null, null],
          // 강화(각인) 노드 레벨
          enhance: createEnhance(),
          // 장비 슬롯: 각 원소는 null 또는 장비 인스턴스 (전 슬롯 — gear.mjs 단일 소스)
          gear: emptyGearSet()
        };
      }

      // 레벨업 비용(성장 재화). 레벨이 오를수록 비용 증가.
      function levelUpCost(unit) {
        return {
          growth: Math.round(BALANCE.levelCostBase * Math.pow(BALANCE.levelCostGrowth, unit.level - 1))
        };
      }

      // 레벨 상한 = 랭크 × 20. 돌파(랭크업) 없이는 못 넘는다.
      function levelCap(unit) {
        return unit.rank * 20;
      }

      // 한 유닛을 팀 판정에 쓸 "전투 프로필"로 변환.
      // 스킬 효과(치명타/흡혈/관통)와 팀 버프를 함께 실어 보낸다.
      function toCombatProfile(unit) {
        var s = computeStats(unit);
        var mods = collectUnitModifiers(unit);
        // dps = 공격력 * (1 + 속도/200)  → 속도가 공격 빈도에 기여
        var dps = s.atk * (1 + s.spd / 200);
        // 치명타: 기대 피해 배수 = 1 + 확률 × 치명피해
        dps *= 1 + mods.effect.critChance * mods.effect.critDamage;
        return {
          uid: unit.uid,
          hp: s.hp,
          dps: dps,
          def: s.def,
          element: unit.element,
          // 속성 상성 계산용
          effect: mods.effect,
          // lifesteal / defPierce 등
          teamBuffAtk: mods.teamBuff.atk,
          teamBuffDef: mods.teamBuff.def,
          // 팀 피해경감
          teamBuffCrit: mods.teamBuff.critChance // 팀 치명(=dps 배수)
        };
      }

      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/unlocks.ts", ['cc'], function (exports) {
  var cclegacy;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }],
    execute: function () {
      exports({
        isUnlocked: isUnlocked,
        unlockStage: unlockStage
      });
      cclegacy._RF.push({}, "a71bbi82HNF9IEF3qiRElJk", "unlocks", undefined);
      // ─────────────────────────────────────────────────────────────
      // 콘텐츠 게이팅 — 기능별 해금 요구 스테이지(peakStage 기준).
      // 문서 권장(소환20 · 골드던전30 · 강화석던전50 · 펫100 · 아레나200 · 길드300)은
      // 더 긴 수명을 가정. 본 빌드 곡선(7일 ≈ 57층)에 맞춰 실제 경험되도록 조정했다.
      // 값은 데이터라 언제든 프로덕션 수치로 바꿀 수 있다.
      // ─────────────────────────────────────────────────────────────

      var UNLOCKS = exports('UNLOCKS', {
        gacha: 8,
        // 소환 — R2 스타터가 레벨업만으로 도달(~10층) 가능해
        //         "레벨업 → 팀 구성" 온보딩 루프가 자연스럽게 열린다.
        dungeonGold: 20,
        // 골드 던전
        dungeonEssence: 35,
        // 정수(강화석) 던전
        pets: 45,
        // 펫
        emblem: 50,
        // 엠블럼(문장) — 다이아 소비 계정 성장(펫 이후 노출)
        arena: 55,
        // 아레나 (경쟁)
        guardian: 60,
        // 정령/가디언 — 다이아 소환 소환수
        tower: 40,
        // 무한의 탑 (엔드게임 도전)
        guild: 75 // 길드 (경쟁)
      });

      function unlockStage(feature) {
        var _UNLOCKS$feature;
        return (_UNLOCKS$feature = UNLOCKS[feature]) != null ? _UNLOCKS$feature : 0;
      }
      function isUnlocked(state, feature) {
        return (state.peakStage || 1) >= unlockStage(feature);
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/village.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc'], function (exports) {
  var _extends, cclegacy;
  return {
    setters: [function (module) {
      _extends = module.extends;
    }, function (module) {
      cclegacy = module.cclegacy;
    }],
    execute: function () {
      exports('villageTier', villageTier);
      cclegacy._RF.push({}, "93b9cCTPIxG8aZfBQf+NPZs", "village", undefined);
      // ─────────────────────────────────────────────────────────────
      // 본진(마을) 시각 발전 — 진행도가 오를수록 본진이 커지고 화려해지는 '소유의 만족감'.
      //   숫자만 오르는 게 아니라 화면 속 거점이 성장하는 것을 보게 한다.
      //   순수 표시 데이터(능력치 무관). 현재 tier를 쓰는 화면 없음(픽셀 화면 제거로 UI 미연결).
      // ─────────────────────────────────────────────────────────────

      // 진행도(peakStage) 마일스톤 → 발전 단계. 오를 때마다 거점이 한 단계 커진다.
      var VILLAGE_TIERS = exports('VILLAGE_TIERS', [{
        min: 0,
        id: 'camp',
        label: '야영지',
        emoji: '⛺',
        desc: '천막 몇 채와 모닥불.'
      }, {
        min: 20,
        id: 'outpost',
        label: '전초 기지',
        emoji: '🏕️',
        desc: '목책과 망루가 세워졌다.'
      }, {
        min: 60,
        id: 'hamlet',
        label: '작은 마을',
        emoji: '🏘️',
        desc: '집과 대장간이 들어섰다.'
      }, {
        min: 150,
        id: 'town',
        label: '성읍',
        emoji: '🏰',
        desc: '성벽과 시장이 번성한다.'
      }, {
        min: 400,
        id: 'citadel',
        label: '요새 도시',
        emoji: '🏯',
        desc: '거대한 성채가 하늘을 찌른다.'
      }, {
        min: 1000,
        id: 'capital',
        label: '수도',
        emoji: '🌆',
        desc: '엘 로그의 심장, 빛나는 수도.'
      }]);

      // peakStage → 현재 발전 단계(+다음 단계까지 진행 정보).
      function villageTier(peakStage) {
        if (peakStage === void 0) {
          peakStage = 1;
        }
        var idx = 0;
        for (var i = 0; i < VILLAGE_TIERS.length; i++) {
          if (peakStage >= VILLAGE_TIERS[i].min) idx = i;else break;
        }
        var cur = VILLAGE_TIERS[idx];
        var next = VILLAGE_TIERS[idx + 1] || null;
        var progress = next ? Math.min(1, (peakStage - cur.min) / (next.min - cur.min)) : 1;
        return _extends({}, cur, {
          index: idx,
          next: next,
          progress: progress
        });
      }
      cclegacy._RF.pop();
    }
  };
});

(function(r) {
  r('virtual:///prerequisite-imports/main', 'chunks:///_virtual/main'); 
})(function(mid, cid) {
    System.register(mid, [cid], function (_export, _context) {
    return {
        setters: [function(_m) {
            var _exportObj = {};

            for (var _key in _m) {
              if (_key !== "default" && _key !== "__esModule") _exportObj[_key] = _m[_key];
            }
      
            _export(_exportObj);
        }],
        execute: function () { }
    };
    });
});