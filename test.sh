#!/bin/sh
# 运行端到端测试的脚本

# 加载环境变量
if [ -f .env ]; then
  export $(cat .env | grep -v ^# | xargs)
fi

# 设置测试环境变量
export NODE_ENV=test

# 运行测试
echo "🧪 运行端到端测试..."
npx jest --config ./test/jest-e2e.json

# 退出状态
exit $?
