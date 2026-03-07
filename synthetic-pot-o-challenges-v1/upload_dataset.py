from datasets import Dataset, load_dataset
from huggingface_hub import login

login()

dataset = load_dataset("json", data_files="synthetic-pot-o-challenges-v1.jsonl", split="train")
dataset = dataset.train_test_split(test_size=0.1)
dataset.push_to_hub("Tribewarez/synthetic-pot-o-challenges-v1", private=False)
