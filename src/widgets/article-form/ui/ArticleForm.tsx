import { Button, Form, Input, Space, Typography } from 'antd'
import { DownloadOutlined } from '@ant-design/icons'

export type ArticleFormValues = {
  article: string
}

type ArticleFormProps = {
  loading?: boolean
  onSubmit: (nm: number) => void
}

function parseArticle(value: string): number | null {
  const digits = value.trim().replace(/\s+/g, '')
  if (!/^\d{4,12}$/.test(digits)) {
    return null
  }
  return Number(digits)
}

export function ArticleForm({ loading, onSubmit }: ArticleFormProps) {
  const [form] = Form.useForm<ArticleFormValues>()

  return (
    <Form
      form={form}
      layout="vertical"
      requiredMark={false}
      onFinish={(values) => {
        const nm = parseArticle(values.article)
        if (nm !== null) {
          onSubmit(nm)
        }
      }}
      className="w-full max-w-xl"
      initialValues={{ article: '604174866' }}
    >
      <Form.Item
        label="Артикул Wildberries"
        name="article"
        rules={[
          { required: true, message: 'Введите артикул' },
          {
            validator: async (_, value: string) => {
              if (!value || parseArticle(value) !== null) {
                return
              }
              throw new Error('Артикул — число 4–12 цифр')
            },
          },
        ]}
        extra={
          <Typography.Text type="secondary">
            Пример: 604174866 (карточка с фото и видео)
          </Typography.Text>
        }
      >
        <Input
          size="large"
          placeholder="Например, 604174866"
          allowClear
          inputMode="numeric"
          autoComplete="off"
        />
      </Form.Item>

      <Space>
        <Button
          type="primary"
          htmlType="submit"
          size="large"
          icon={<DownloadOutlined />}
          loading={loading}
        >
          Скачать фото
        </Button>
      </Space>
    </Form>
  )
}
