import json
import os
from collections import defaultdict


def create_additional_json():
    # 确保目录存在
    os.makedirs("data", exist_ok=True)

    # 1. 读取原始卡片数据
    with open("website/data/cards_ja.json", "r", encoding="utf-8") as f:
        card_data = json.load(f)

    # 2. 分组卡片数据
    grouped_cards = defaultdict(list)
    for card_num, card_info in card_data.items():
        card_id = card_info["card_id"]
        grouped_cards[card_id].append(card_num)

    # 3. 创建additional数据
    additional_data = {}
    for card_id, card_numbers in grouped_cards.items():
        if not card_numbers:  # 跳过空列表
            continue

        # 设置主版本
        first_card_num = card_numbers[0]
        additional_data[first_card_num] = {
            "is_primary": True,
            "card_id": card_id,
            "other_versions": card_numbers[1:] if len(card_numbers) > 1 else [],
        }

        # 为其他版本设置非主版本
        for other_num in card_numbers[1:]:
            additional_data[other_num] = {
                "is_primary": False,
                "card_id": card_id,
                "other_versions": [
                    n for n in card_numbers if n != other_num
                ],  # 其他所有版本
            }

    # 4. 写入additional文件
    with open("data/cards_ja.additional2.json", "w", encoding="utf-8") as f:
        json.dump(additional_data, f, indent=2, ensure_ascii=False)

    print(
        f"处理完成！共处理 {len(card_data)} 张卡片，发现 {len(grouped_cards)} 个唯一card_id"
    )
    print(f"创建完成！共处理 {len(additional_data)} 张卡牌")
    print(f"结果已保存到 data/cards_ja.additional2.json")


if __name__ == "__main__":
    create_additional_json()
