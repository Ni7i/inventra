using FluentValidation;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace Inventra.Api.Validation;

/// <summary>
/// Runs any registered <see cref="IValidator{T}"/> against action arguments before
/// the action executes and short-circuits with a 400 validation problem on failure.
/// Replaces the automatic MVC integration from the deprecated FluentValidation.AspNetCore.
/// </summary>
public sealed class FluentValidationFilter : IAsyncActionFilter
{
    private readonly IServiceProvider _services;

    public FluentValidationFilter(IServiceProvider services) => _services = services;

    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        foreach (var argument in context.ActionArguments.Values)
        {
            if (argument is null) continue;

            var validatorType = typeof(IValidator<>).MakeGenericType(argument.GetType());
            if (_services.GetService(validatorType) is not IValidator validator) continue;

            var result = await validator.ValidateAsync(
                new ValidationContext<object>(argument), context.HttpContext.RequestAborted);
            if (result.IsValid) continue;

            var problem = new ValidationProblemDetails(result.ToDictionary())
            {
                Status = StatusCodes.Status400BadRequest,
                Detail = string.Join(" ", result.Errors.Select(e => e.ErrorMessage).Distinct())
            };
            context.Result = new BadRequestObjectResult(problem)
            {
                ContentTypes = { "application/problem+json" }
            };
            return;
        }

        await next();
    }
}
